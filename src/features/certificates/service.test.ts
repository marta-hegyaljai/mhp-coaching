import {afterAll, describe, expect, it} from "vitest";

import {closeDb} from "@/db";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {hashPassword} from "@/features/auth/password";
import {
  insertUser,
  listAuditForUser,
} from "@/features/auth/repository";
import {normalizeEmail} from "@/features/auth/email";
import {CertificateError} from "@/features/certificates/errors";
import {
  attachCertificate,
  authorizeCertificateDownload,
  listOwnCertificates,
  replaceCertificateDocument,
  revokeCertificate,
} from "@/features/certificates/service";
import {createPostgresCertificateDocumentStore} from "@/features/certificates/postgres-document-store";
import {findCertificateById} from "@/features/certificates/repository";
import {toCertificateCardView} from "@/features/certificates/views";
import {getDatabaseUrl} from "@/lib/database-url";

const hasDatabase = Boolean(getDatabaseUrl());

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
}

function pdfBytes(marker = "ok"): Buffer {
  return Buffer.from(`%PDF-1.4\n${marker}\n%%EOF\n`, "utf8");
}

describe.skipIf(!hasDatabase)("course certificate library", () => {
  afterAll(async () => {
    await closeDb();
  });

  async function createAdmin() {
    const email = uniqueEmail("cert-admin");
    return insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Cert",
      lastName: "Admin",
      locale: "en",
      isAdmin: true,
      passwordHash: await hashPassword("admin-password-12"),
      emailVerifiedAt: new Date(),
    });
  }

  async function createUser(label: string) {
    const email = uniqueEmail(label);
    return insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Pat",
      lastName: label,
      locale: "en",
      passwordHash: await hashPassword("user-password-12"),
      emailVerifiedAt: new Date(),
    });
  }

  it("lets an admin attach a PDF that only the owner can download", async () => {
    const admin = await createAdmin();
    const owner = await createUser("owner");
    const stranger = await createUser("stranger");

    const {certificateId} = await attachCertificate({
      actor: admin,
      userId: owner.id,
      courseId: "omni-practitioner",
      issuedOn: "2026-01-15",
      pdf: pdfBytes("owner-doc"),
    });

    const ownerDownload = await authorizeCertificateDownload({
      actor: owner,
      certificateId,
    });
    expect(ownerDownload.ok).toBe(true);
    if (ownerDownload.ok) {
      expect(ownerDownload.bytes.includes(Buffer.from("owner-doc"))).toBe(true);
      expect(ownerDownload.filename).toMatch(/omni.*2026-01-15\.pdf$/);
    }

    const strangerDownload = await authorizeCertificateDownload({
      actor: stranger,
      certificateId,
    });
    expect(strangerDownload).toEqual({ok: false, status: 404, code: "notFound"});

    const guessed = await authorizeCertificateDownload({
      actor: stranger,
      certificateId: "11111111-1111-4111-8111-111111111111",
    });
    expect(guessed).toEqual({ok: false, status: 404, code: "notFound"});

    const events = await listAuditForUser(owner.id);
    expect(events[0]?.action).toBe(AUDIT_ACTIONS.CERTIFICATE_ATTACHED);
    expect(events[0]?.actorUserId).toBe(admin.id);
    expect(JSON.stringify(events[0]?.after)).not.toMatch(/owner-doc|%PDF/);
  });

  it("revokes download immediately while keeping the certificate record", async () => {
    const admin = await createAdmin();
    const owner = await createUser("revoke");
    const {certificateId} = await attachCertificate({
      actor: admin,
      userId: owner.id,
      courseId: "omni-practitioner",
      issuedOn: "2026-02-01",
      pdf: pdfBytes("revoke-me"),
    });

    await revokeCertificate({actor: admin, certificateId});

    const ownerDownload = await authorizeCertificateDownload({
      actor: owner,
      certificateId,
    });
    expect(ownerDownload).toEqual({ok: false, status: 403, code: "forbidden"});

    const adminDownload = await authorizeCertificateDownload({
      actor: admin,
      certificateId,
    });
    expect(adminDownload.ok).toBe(true);

    const {listCertificatesForUser} = await import(
      "@/features/certificates/repository"
    );
    const [record] = await listCertificatesForUser(owner.id);
    expect(record.status).toBe("REVOKED");
    expect(toCertificateCardView(record, "en").documentState).toBe("revoked");
    expect(record.courseTitle.en).toContain("OMNI");
  });

  it("replaces an active document and fails safely when the file is missing", async () => {
    const admin = await createAdmin();
    const owner = await createUser("replace");
    const {certificateId} = await attachCertificate({
      actor: admin,
      userId: owner.id,
      courseId: "master-practitioner",
      issuedOn: "2026-03-01",
      pdf: pdfBytes("first"),
    });

    await replaceCertificateDocument({
      actor: admin,
      certificateId,
      pdf: pdfBytes("second"),
    });

    const download = await authorizeCertificateDownload({
      actor: owner,
      certificateId,
    });
    expect(download.ok).toBe(true);
    if (download.ok) {
      expect(download.bytes.includes(Buffer.from("second"))).toBe(true);
      expect(download.bytes.includes(Buffer.from("first"))).toBe(false);
    }
  });

  it("shows an unavailable document without exposing storage internals", async () => {
    const admin = await createAdmin();
    const owner = await createUser("missing-file");
    const {certificateId} = await attachCertificate({
      actor: admin,
      userId: owner.id,
      courseId: "omni-practitioner",
      issuedOn: "2026-04-01",
      pdf: pdfBytes("to-delete"),
    });

    const certificate = await findCertificateById(certificateId);
    expect(certificate?.documentId).toBeTruthy();
    if (certificate?.documentId) {
      await createPostgresCertificateDocumentStore().remove(certificate.documentId);
    }

    const listed = await listOwnCertificates(owner.id);
    expect(toCertificateCardView(listed[0], "en").documentState).toBe("unavailable");

    const download = await authorizeCertificateDownload({
      actor: owner,
      certificateId,
    });
    expect(download).toEqual({ok: false, status: 404, code: "unavailable"});
    expect(JSON.stringify(download)).not.toMatch(/bytea|postgres|storage/i);
  });

  it("refuses to replace a certificate that was revoked in the meantime", async () => {
    const admin = await createAdmin();
    const owner = await createUser("race-revoke");
    const {certificateId} = await attachCertificate({
      actor: admin,
      userId: owner.id,
      courseId: "omni-practitioner",
      issuedOn: "2026-05-01",
      pdf: pdfBytes("before-revoke"),
    });

    await revokeCertificate({actor: admin, certificateId});

    await expect(
      replaceCertificateDocument({
        actor: admin,
        certificateId,
        pdf: pdfBytes("after-revoke"),
      }),
    ).rejects.toMatchObject({code: "alreadyRevoked"});

    const download = await authorizeCertificateDownload({
      actor: admin,
      certificateId,
    });
    expect(download.ok).toBe(true);
    if (download.ok) {
      expect(download.bytes.includes(Buffer.from("before-revoke"))).toBe(true);
      expect(download.bytes.includes(Buffer.from("after-revoke"))).toBe(false);
    }
  });

  it("rejects a course-only user attaching a certificate and unknown courses", async () => {
    const owner = await createUser("noadmin");
    await expect(
      attachCertificate({
        actor: owner,
        userId: owner.id,
        courseId: "omni-practitioner",
        issuedOn: "2026-01-01",
        pdf: pdfBytes(),
      }),
    ).rejects.toBeInstanceOf(CertificateError);

    const admin = await createAdmin();
    await expect(
      attachCertificate({
        actor: admin,
        userId: owner.id,
        courseId: "not-a-course",
        issuedOn: "2026-01-01",
        pdf: pdfBytes(),
      }),
    ).rejects.toMatchObject({code: "invalidCourse"});
  });
});

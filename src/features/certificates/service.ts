import type {User} from "@/db/schema";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {canAdminister} from "@/features/auth/policy";
import {findUserById, recordAudit} from "@/features/auth/repository";
import {
  CERTIFICATE_PDF_CONTENT_TYPE,
  ISSUED_ON_PATTERN,
} from "@/features/certificates/constants";
import type {CertificateDocumentStore} from "@/features/certificates/document-store";
import {CertificateError} from "@/features/certificates/errors";
import {validateCertificatePdf} from "@/features/certificates/pdf";
import {createPostgresCertificateDocumentStore} from "@/features/certificates/postgres-document-store";
import {
  deleteCertificate,
  findCertificateById,
  insertCertificate,
  listCertificatesForUser,
  updateActiveCertificate,
} from "@/features/certificates/repository";
import {certificateAuditSnapshot} from "@/features/certificates/views";
import {loadCourseById} from "@/features/courses/live";
import {isUuid} from "@/lib/uuid";

const documents: CertificateDocumentStore = createPostgresCertificateDocumentStore();

function requireAdmin(actor: User): void {
  if (!canAdminister(actor)) {
    throw new CertificateError("forbidden");
  }
}

export function parseIssuedOn(value: string): string {
  const trimmed = value.trim();
  if (!ISSUED_ON_PATTERN.test(trimmed)) {
    throw new CertificateError("invalidIssuedOn");
  }

  const [year, month, day] = trimmed.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    throw new CertificateError("invalidIssuedOn");
  }

  return trimmed;
}

async function requireTargetUser(userId: string) {
  if (!isUuid(userId)) {
    throw new CertificateError("notFound");
  }

  const user = await findUserById(userId);
  if (!user) {
    throw new CertificateError("notFound");
  }
  return user;
}

export async function attachCertificate(input: {
  actor: User;
  userId: string;
  courseId: string;
  issuedOn: string;
  pdf: Buffer;
}): Promise<{certificateId: string}> {
  requireAdmin(input.actor);
  const target = await requireTargetUser(input.userId);
  const course = await loadCourseById(input.courseId.trim());
  if (!course) {
    throw new CertificateError("invalidCourse");
  }

  const issuedOn = parseIssuedOn(input.issuedOn);
  const bytes = validateCertificatePdf({
    bytes: input.pdf,
    contentType: CERTIFICATE_PDF_CONTENT_TYPE,
  });
  const document = await documents.put(bytes);
  let certificateId: string | undefined;

  try {
    const certificate = await insertCertificate({
      userId: target.id,
      courseId: course.id,
      courseTitle: course.title,
      issuedOn,
      documentId: document.id,
    });
    certificateId = certificate.id;

    await recordAudit({
      actorUserId: input.actor.id,
      targetUserId: target.id,
      action: AUDIT_ACTIONS.CERTIFICATE_ATTACHED,
      before: null,
      after: certificateAuditSnapshot(certificate),
    });

    return {certificateId: certificate.id};
  } catch (error) {
    if (certificateId) {
      await deleteCertificate(certificateId).catch(() => undefined);
    }
    await documents.remove(document.id).catch(() => undefined);
    throw error;
  }
}

export async function replaceCertificateDocument(input: {
  actor: User;
  certificateId: string;
  pdf: Buffer;
}): Promise<void> {
  requireAdmin(input.actor);
  if (!isUuid(input.certificateId)) {
    throw new CertificateError("notFound");
  }

  const certificate = await findCertificateById(input.certificateId);
  if (!certificate) {
    throw new CertificateError("notFound");
  }
  if (certificate.status === "REVOKED") {
    throw new CertificateError("alreadyRevoked");
  }

  const bytes = validateCertificatePdf({
    bytes: input.pdf,
    contentType: CERTIFICATE_PDF_CONTENT_TYPE,
  });
  const nextDocument = await documents.put(bytes);
  const previousDocumentId = certificate.documentId;
  let committed = false;

  try {
    const updated = await updateActiveCertificate(certificate.id, {
      documentId: nextDocument.id,
    });

    if (!updated) {
      throw new CertificateError(
        (await findCertificateById(certificate.id))?.status === "REVOKED"
          ? "alreadyRevoked"
          : "notFound",
      );
    }
    committed = true;

    await recordAudit({
      actorUserId: input.actor.id,
      targetUserId: certificate.userId,
      action: AUDIT_ACTIONS.CERTIFICATE_REPLACED,
      before: certificateAuditSnapshot(certificate),
      after: certificateAuditSnapshot(updated),
    });

    if (previousDocumentId && previousDocumentId !== nextDocument.id) {
      await documents.remove(previousDocumentId).catch(() => undefined);
    }
  } catch (error) {
    if (!committed) {
      await documents.remove(nextDocument.id).catch(() => undefined);
    }
    throw error;
  }
}

export async function revokeCertificate(input: {
  actor: User;
  certificateId: string;
}): Promise<void> {
  requireAdmin(input.actor);
  if (!isUuid(input.certificateId)) {
    throw new CertificateError("notFound");
  }

  const certificate = await findCertificateById(input.certificateId);
  if (!certificate) {
    throw new CertificateError("notFound");
  }
  if (certificate.status === "REVOKED") {
    throw new CertificateError("alreadyRevoked");
  }

  const updated = await updateActiveCertificate(certificate.id, {
    status: "REVOKED",
    revokedAt: new Date(),
    revokedByUserId: input.actor.id,
  });
  if (!updated) {
    throw new CertificateError("alreadyRevoked");
  }

  await recordAudit({
    actorUserId: input.actor.id,
    targetUserId: certificate.userId,
    action: AUDIT_ACTIONS.CERTIFICATE_REVOKED,
    before: certificateAuditSnapshot(certificate),
    after: certificateAuditSnapshot(updated),
  });
}

export async function listOwnCertificates(userId: string) {
  const certificates = await listCertificatesForUser(userId);
  return Promise.all(
    certificates.map(async (certificate) => {
      if (!certificate.documentId || certificate.status === "REVOKED") {
        return certificate;
      }

      const present = await documents.exists(certificate.documentId);
      return present ? certificate : {...certificate, documentId: null};
    }),
  );
}

export type CertificateDownload =
  | {ok: true; bytes: Buffer; filename: string}
  | {ok: false; status: 401 | 403 | 404; code: "unauthenticated" | "forbidden" | "notFound" | "unavailable"};

export async function authorizeCertificateDownload(input: {
  actor: User | null;
  certificateId: string;
}): Promise<CertificateDownload> {
  if (!input.actor) {
    return {ok: false, status: 401, code: "unauthenticated"};
  }

  if (!isUuid(input.certificateId)) {
    return {ok: false, status: 404, code: "notFound"};
  }

  const certificate = await findCertificateById(input.certificateId);
  if (!certificate) {
    return {ok: false, status: 404, code: "notFound"};
  }

  const isOwner = certificate.userId === input.actor.id;
  const isAdmin = canAdminister(input.actor);

  if (!isOwner && !isAdmin) {
    return {ok: false, status: 404, code: "notFound"};
  }

  if (certificate.status === "REVOKED" && !isAdmin) {
    return {ok: false, status: 403, code: "forbidden"};
  }

  if (!certificate.documentId) {
    return {ok: false, status: 404, code: "unavailable"};
  }

  const bytes = await documents.get(certificate.documentId);
  if (!bytes) {
    return {ok: false, status: 404, code: "unavailable"};
  }

  const title =
    certificate.courseTitle.en ||
    certificate.courseTitle.fr ||
    certificate.courseTitle.de ||
    "";
  const safeTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  return {
    ok: true,
    bytes,
    filename: `${safeTitle || "certificate"}-${certificate.issuedOn}.pdf`,
  };
}

export async function lookupCertificateForAdmin(certificateId: string) {
  if (!isUuid(certificateId)) {
    return undefined;
  }
  return findCertificateById(certificateId);
}

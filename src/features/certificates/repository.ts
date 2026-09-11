import {and, desc, eq} from "drizzle-orm";

import {getDb} from "@/db";
import {
  courseCertificates,
  type CourseCertificate,
  type CourseCertificateStatus,
} from "@/db/schema";
import type {LocalizedJson} from "@/db/schema";

export type NewCourseCertificate = {
  userId: string;
  courseId: string;
  courseTitle: LocalizedJson;
  issuedOn: string;
  documentId?: string | null;
  status?: CourseCertificateStatus;
};

export async function insertCertificate(
  input: NewCourseCertificate,
): Promise<CourseCertificate> {
  const [row] = await getDb()
    .insert(courseCertificates)
    .values({
      userId: input.userId,
      courseId: input.courseId,
      courseTitle: input.courseTitle,
      issuedOn: input.issuedOn,
      documentId: input.documentId ?? null,
      status: input.status ?? "ACTIVE",
    })
    .returning();

  return row;
}

export async function findCertificateById(
  id: string,
): Promise<CourseCertificate | undefined> {
  const [row] = await getDb()
    .select()
    .from(courseCertificates)
    .where(eq(courseCertificates.id, id))
    .limit(1);

  return row;
}

export async function listCertificatesForUser(
  userId: string,
): Promise<CourseCertificate[]> {
  return getDb()
    .select()
    .from(courseCertificates)
    .where(eq(courseCertificates.userId, userId))
    .orderBy(desc(courseCertificates.issuedOn), desc(courseCertificates.createdAt));
}

export async function updateCertificate(
  id: string,
  values: Partial<
    Pick<
      CourseCertificate,
      "documentId" | "status" | "revokedAt" | "revokedByUserId"
    >
  >,
): Promise<CourseCertificate | undefined> {
  const [row] = await getDb()
    .update(courseCertificates)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(courseCertificates.id, id))
    .returning();

  return row;
}

/** Same as update, but loses the race if another admin already revoked. */
export async function updateActiveCertificate(
  id: string,
  values: Partial<
    Pick<
      CourseCertificate,
      "documentId" | "status" | "revokedAt" | "revokedByUserId"
    >
  >,
): Promise<CourseCertificate | undefined> {
  const [row] = await getDb()
    .update(courseCertificates)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(
      and(eq(courseCertificates.id, id), eq(courseCertificates.status, "ACTIVE")),
    )
    .returning();

  return row;
}

export async function deleteCertificate(id: string): Promise<void> {
  await getDb().delete(courseCertificates).where(eq(courseCertificates.id, id));
}

export async function findOwnedCertificate(
  id: string,
  userId: string,
): Promise<CourseCertificate | undefined> {
  const [row] = await getDb()
    .select()
    .from(courseCertificates)
    .where(
      and(eq(courseCertificates.id, id), eq(courseCertificates.userId, userId)),
    )
    .limit(1);

  return row;
}

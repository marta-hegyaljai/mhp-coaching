import {and, desc, eq, sql} from "drizzle-orm";

import {getDb} from "@/db";
import {waitlistEntries, type NewWaitlistEntry, type WaitlistEntry} from "@/db/schema";
import {isUniqueViolation} from "@/features/auth/unique-email";

export async function createWaitlistEntry(
  input: NewWaitlistEntry,
): Promise<WaitlistEntry | "duplicate"> {
  try {
    const [entry] = await getDb().insert(waitlistEntries).values(input).returning();
    return entry;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return "duplicate";
    }
    throw error;
  }
}

export async function listWaitlistEntries(): Promise<WaitlistEntry[]> {
  return getDb()
    .select()
    .from(waitlistEntries)
    .orderBy(desc(waitlistEntries.createdAt));
}

export async function listWaitlistForCourse(courseId: string): Promise<WaitlistEntry[]> {
  return getDb()
    .select()
    .from(waitlistEntries)
    .where(eq(waitlistEntries.courseId, courseId))
    .orderBy(desc(waitlistEntries.createdAt));
}

/**
 * Returns the removed row so the caller can audit exactly what was deleted.
 * The course is part of the predicate, so a mismatched request deletes nothing.
 */
export async function deleteWaitlistEntry(input: {
  id: string;
  courseId: string;
}): Promise<WaitlistEntry | undefined> {
  const [entry] = await getDb()
    .delete(waitlistEntries)
    .where(
      and(
        eq(waitlistEntries.id, input.id),
        eq(waitlistEntries.courseId, input.courseId),
      ),
    )
    .returning();

  return entry;
}

export async function markWaitlistNotified(input: {
  id: string;
  courseId: string;
}): Promise<WaitlistEntry | undefined> {
  const [entry] = await getDb()
    .update(waitlistEntries)
    .set({notifiedAt: new Date()})
    .where(
      and(
        eq(waitlistEntries.id, input.id),
        eq(waitlistEntries.courseId, input.courseId),
        sql`${waitlistEntries.notifiedAt} is null`,
      ),
    )
    .returning();

  return entry;
}

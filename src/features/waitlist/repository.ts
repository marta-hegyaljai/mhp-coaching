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

export async function markWaitlistNotified(
  id: string,
): Promise<WaitlistEntry | undefined> {
  const [entry] = await getDb()
    .update(waitlistEntries)
    .set({notifiedAt: new Date()})
    .where(and(eq(waitlistEntries.id, id), sql`${waitlistEntries.notifiedAt} is null`))
    .returning();

  return entry;
}

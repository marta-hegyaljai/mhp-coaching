import {desc, eq} from "drizzle-orm";

import {getDb} from "@/db";
import {waitlistEntries, type NewWaitlistEntry, type WaitlistEntry} from "@/db/schema";

export async function createWaitlistEntry(
  input: NewWaitlistEntry,
): Promise<WaitlistEntry | "duplicate"> {
  const [entry] = await getDb()
    .insert(waitlistEntries)
    .values(input)
    .onConflictDoNothing({
      target: [waitlistEntries.courseId, waitlistEntries.email],
    })
    .returning();

  return entry ?? "duplicate";
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

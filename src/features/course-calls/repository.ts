import {and, asc, eq, gte, lt, sql} from "drizzle-orm";

import {getDb} from "@/db";
import {
  courseCallHours,
  courseCalls,
  courseInquiries,
  type CourseCall,
  type CourseCallHour,
  type CourseInquiry,
  type NewCourseCall,
  type NewCourseInquiry,
} from "@/db/schema";

export async function listCallHours(): Promise<CourseCallHour[]> {
  return getDb()
    .select()
    .from(courseCallHours)
    .orderBy(asc(courseCallHours.weekday), asc(courseCallHours.startMinute));
}

export async function replaceCallHours(
  intervals: Array<{weekday: number; startMinute: number; endMinute: number}>,
): Promise<CourseCallHour[]> {
  return getDb().transaction(async (tx) => {
    await tx.delete(courseCallHours);
    if (intervals.length === 0) {
      return [];
    }
    return tx.insert(courseCallHours).values(intervals).returning();
  });
}

export async function listScheduledCallsBetween(
  start: Date,
  endExclusive: Date,
): Promise<CourseCall[]> {
  return getDb()
    .select()
    .from(courseCalls)
    .where(
      and(
        eq(courseCalls.status, "SCHEDULED"),
        gte(courseCalls.startsAt, start),
        lt(courseCalls.startsAt, endExclusive),
      ),
    )
    .orderBy(asc(courseCalls.startsAt));
}

export async function insertScheduledCall(
  input: NewCourseCall,
): Promise<{ok: true; call: CourseCall} | {ok: false; reason: "overlap"}> {
  return getDb().transaction(async (tx) => {
    try {
      const [call] = await tx.insert(courseCalls).values(input).returning();
      return {ok: true as const, call};
    } catch (error) {
      if (isExclusionViolation(error)) {
        return {ok: false as const, reason: "overlap" as const};
      }
      throw error;
    }
  });
}

export async function getCourseCallById(id: string): Promise<CourseCall | undefined> {
  const [row] = await getDb()
    .select()
    .from(courseCalls)
    .where(eq(courseCalls.id, id))
    .limit(1);
  return row;
}

export async function cancelScheduledCall(id: string): Promise<CourseCall | undefined> {
  const [row] = await getDb()
    .update(courseCalls)
    .set({status: "CANCELLED"})
    .where(and(eq(courseCalls.id, id), eq(courseCalls.status, "SCHEDULED")))
    .returning();
  return row;
}

export async function listAdminCalls(input: {
  q?: string;
  when: "upcoming" | "past" | "all";
  now: Date;
  limit: number;
  offset: number;
}): Promise<{rows: CourseCall[]; total: number}> {
  const filters = [];
  if (input.when === "upcoming") {
    filters.push(gte(courseCalls.startsAt, input.now));
  } else if (input.when === "past") {
    filters.push(lt(courseCalls.startsAt, input.now));
  }
  if (input.q) {
    const needle = `%${escapeLike(input.q)}%`;
    filters.push(
      sql`(
        ${courseCalls.firstName} ILIKE ${needle}
        OR ${courseCalls.lastName} ILIKE ${needle}
        OR ${courseCalls.email} ILIKE ${needle}
        OR ${courseCalls.phone} ILIKE ${needle}
        OR COALESCE(${courseCalls.courseTitle}, '') ILIKE ${needle}
      )`,
    );
  }
  const where = filters.length > 0 ? and(...filters) : undefined;
  const db = getDb();
  const [countRow] = await db
    .select({total: sql<number>`count(*)::int`})
    .from(courseCalls)
    .where(where);
  const rows = await db
    .select()
    .from(courseCalls)
    .where(where)
    .orderBy(
      input.when === "past" ? sql`${courseCalls.startsAt} DESC` : asc(courseCalls.startsAt),
    )
    .limit(input.limit)
    .offset(input.offset);
  return {rows, total: countRow?.total ?? 0};
}

export async function insertCourseInquiry(input: NewCourseInquiry): Promise<CourseInquiry> {
  const [row] = await getDb().insert(courseInquiries).values(input).returning();
  return row;
}

export async function getCourseInquiryById(id: string): Promise<CourseInquiry | undefined> {
  const [row] = await getDb()
    .select()
    .from(courseInquiries)
    .where(eq(courseInquiries.id, id))
    .limit(1);
  return row;
}

export async function listAdminInquiries(input: {
  q?: string;
  limit: number;
  offset: number;
}): Promise<{rows: CourseInquiry[]; total: number}> {
  const where = input.q
    ? sql`(
        ${courseInquiries.firstName} ILIKE ${`%${escapeLike(input.q)}%`}
        OR ${courseInquiries.lastName} ILIKE ${`%${escapeLike(input.q)}%`}
        OR ${courseInquiries.email} ILIKE ${`%${escapeLike(input.q)}%`}
        OR ${courseInquiries.phone} ILIKE ${`%${escapeLike(input.q)}%`}
        OR COALESCE(${courseInquiries.courseTitle}, '') ILIKE ${`%${escapeLike(input.q)}%`}
      )`
    : undefined;
  const db = getDb();
  const [countRow] = await db
    .select({total: sql<number>`count(*)::int`})
    .from(courseInquiries)
    .where(where);
  const rows = await db
    .select()
    .from(courseInquiries)
    .where(where)
    .orderBy(sql`${courseInquiries.createdAt} DESC`)
    .limit(input.limit)
    .offset(input.offset);
  return {rows, total: countRow?.total ?? 0};
}

function escapeLike(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function isExclusionViolation(error: unknown): boolean {
  const codes = collectErrorCodes(error);
  if (codes.has("23P01")) {
    return true;
  }
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes("course_calls_no_overlap");
}

function collectErrorCodes(error: unknown, seen = new Set<unknown>()): Set<string> {
  const codes = new Set<string>();
  if (!error || typeof error !== "object" || seen.has(error)) {
    return codes;
  }
  seen.add(error);
  if ("code" in error && typeof error.code === "string") {
    codes.add(error.code);
  }
  if ("cause" in error) {
    for (const code of collectErrorCodes(error.cause, seen)) {
      codes.add(code);
    }
  }
  return codes;
}

import {and, desc, eq, inArray} from "drizzle-orm";

import {getDb} from "@/db";
import {bookings, type Booking} from "@/db/schema";
import {isUpcomingRegistration} from "@/features/account/course-timing";
import {todayIsoInZurich} from "@/features/courses/dates";

const VISIBLE_STATUSES = ["PAID", "PENDING", "LEAD", "REFUNDED"] as const;

export type MyCourseList = {
  upcoming: Booking[];
  past: Booking[];
};

export async function listMyCourses(userId: string, today = todayIsoInZurich()): Promise<MyCourseList> {
  const rows = await getDb()
    .select()
    .from(bookings)
    .where(
      and(eq(bookings.userId, userId), inArray(bookings.status, [...VISIBLE_STATUSES])),
    )
    .orderBy(desc(bookings.courseDateStart), desc(bookings.createdAt));

  const upcoming: Booking[] = [];
  const past: Booking[] = [];

  for (const row of rows) {
    if (isUpcomingRegistration(row.courseDateStart, row.courseDateEnd, today)) {
      upcoming.push(row);
    } else {
      past.push(row);
    }
  }

  return {upcoming, past};
}

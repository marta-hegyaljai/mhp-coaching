import {and, desc, eq, sql} from "drizzle-orm";

import {getDb} from "@/db";
import {
  bookings,
  inquiries,
  type Booking,
  type Inquiry,
  type NewInquiry,
} from "@/db/schema";

export async function createInquiry(input: NewInquiry): Promise<Inquiry> {
  const [inquiry] = await getDb().insert(inquiries).values(input).returning();
  return inquiry;
}

export async function getInquiryById(id: string): Promise<Inquiry | undefined> {
  const [inquiry] = await getDb()
    .select()
    .from(inquiries)
    .where(eq(inquiries.id, id))
    .limit(1);

  return inquiry;
}

export async function listAdminContactInquiries(input: {
  q?: string;
  limit: number;
  offset: number;
}): Promise<{rows: Inquiry[]; total: number}> {
  const where = input.q
    ? sql`(
        ${inquiries.name} ILIKE ${`%${escapeLike(input.q)}%`}
        OR ${inquiries.email} ILIKE ${`%${escapeLike(input.q)}%`}
        OR COALESCE(${inquiries.phone}, '') ILIKE ${`%${escapeLike(input.q)}%`}
        OR ${inquiries.message} ILIKE ${`%${escapeLike(input.q)}%`}
        OR COALESCE(${inquiries.courseTitle}, '') ILIKE ${`%${escapeLike(input.q)}%`}
      )`
    : undefined;
  const db = getDb();
  const [countRow] = await db
    .select({total: sql<number>`count(*)::int`})
    .from(inquiries)
    .where(where);
  const rows = await db
    .select()
    .from(inquiries)
    .where(where)
    .orderBy(desc(inquiries.createdAt), desc(inquiries.id))
    .limit(input.limit)
    .offset(input.offset);
  return {rows, total: countRow?.total ?? 0};
}

export async function getLeadBookingById(id: string): Promise<Booking | undefined> {
  const [booking] = await getDb()
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, id), eq(bookings.status, "LEAD")))
    .limit(1);
  return booking;
}

/**
 * Other-payment-method bookings that never left a written contact message.
 * Those with a payment inquiry stay on that inbox row so the person is not
 * listed twice.
 */
export async function listAdminLeadBookings(input: {
  q?: string;
  limit: number;
  offset: number;
}): Promise<{rows: Booking[]; total: number}> {
  const notInquired = sql`NOT EXISTS (
    SELECT 1 FROM ${inquiries}
    WHERE ${inquiries.bookingId} = ${bookings.id}
  )`;
  const search = input.q
    ? sql`(
        ${bookings.firstName} ILIKE ${`%${escapeLike(input.q)}%`}
        OR ${bookings.lastName} ILIKE ${`%${escapeLike(input.q)}%`}
        OR ${bookings.email} ILIKE ${`%${escapeLike(input.q)}%`}
        OR ${bookings.phone} ILIKE ${`%${escapeLike(input.q)}%`}
        OR ${bookings.courseTitle} ILIKE ${`%${escapeLike(input.q)}%`}
      )`
    : undefined;
  const where = and(eq(bookings.status, "LEAD"), notInquired, search);
  const db = getDb();
  const [countRow] = await db
    .select({total: sql<number>`count(*)::int`})
    .from(bookings)
    .where(where);
  const rows = await db
    .select()
    .from(bookings)
    .where(where)
    .orderBy(desc(bookings.createdAt), desc(bookings.id))
    .limit(input.limit)
    .offset(input.offset);
  return {rows, total: countRow?.total ?? 0};
}

function escapeLike(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

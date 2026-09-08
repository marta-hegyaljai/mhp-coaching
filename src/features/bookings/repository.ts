import {and, desc, eq, sql} from "drizzle-orm";

import {getDb} from "@/db";
import {bookings, paymentEvents, type Booking, type BookingStatus} from "@/db/schema";

export type CreateBookingInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  locale: string;
  courseId: string;
  courseDateId: string;
  courseTitle: string;
  courseDateStart: string;
  courseDateEnd?: string;
  location: string;
  amountMinor: number;
  currency: string;
  paymentProvider: string;
  privacyAcceptedAt: Date;
};

export async function createPendingBooking(
  input: CreateBookingInput,
): Promise<Booking> {
  const [booking] = await getDb()
    .insert(bookings)
    .values({
      ...input,
      status: "PENDING",
    })
    .returning();

  return booking;
}

export async function getBookingById(id: string): Promise<Booking | undefined> {
  const [booking] = await getDb()
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);

  return booking;
}

export async function attachPaymentReference(
  bookingId: string,
  paymentReference: string,
): Promise<void> {
  await getDb()
    .update(bookings)
    .set({
      paymentReference,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId));
}

export async function listBookings(): Promise<Booking[]> {
  return getDb().select().from(bookings).orderBy(desc(bookings.createdAt));
}

export async function recordPaymentEvent(input: {
  bookingId: string;
  provider: string;
  providerEventId: string;
  type: string;
  payload?: unknown;
}): Promise<"recorded" | "duplicate"> {
  const inserted = await getDb()
    .insert(paymentEvents)
    .values({
      bookingId: input.bookingId,
      provider: input.provider,
      providerEventId: input.providerEventId,
      type: input.type,
      payload: input.payload ?? null,
    })
    .onConflictDoNothing()
    .returning({id: paymentEvents.id});

  return inserted.length > 0 ? "recorded" : "duplicate";
}

export async function markBookingStatus(input: {
  bookingId: string;
  status: BookingStatus;
  paidAt?: Date;
}): Promise<Booking | undefined> {
  const [booking] = await getDb()
    .update(bookings)
    .set({
      status: input.status,
      paidAt: input.paidAt,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, input.bookingId))
    .returning();

  return booking;
}

export async function markBookingPaidOnce(bookingId: string): Promise<{
  booking: Booking;
  alreadyPaid: boolean;
}> {
  const existing = await getBookingById(bookingId);

  if (!existing) {
    throw new Error(`Booking ${bookingId} was not found`);
  }

  if (existing.status === "PAID") {
    return {booking: existing, alreadyPaid: true};
  }

  const [booking] = await getDb()
    .update(bookings)
    .set({
      status: "PAID",
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(bookings.id, bookingId), sql`${bookings.status} <> 'PAID'`))
    .returning();

  return {booking: booking ?? existing, alreadyPaid: !booking};
}

export async function markConfirmationEmailSent(
  bookingId: string,
): Promise<void> {
  await getDb()
    .update(bookings)
    .set({
      confirmationEmailSentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId));
}

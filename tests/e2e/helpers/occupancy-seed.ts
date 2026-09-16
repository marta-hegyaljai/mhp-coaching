import {resolve} from "node:path";

import {config} from "dotenv";
import {eq} from "drizzle-orm";

import {getDb} from "@/db";
import {bookings} from "@/db/schema";
import {
  countOccupyingEnrolmentsByDate,
  createOccupyingBooking,
} from "@/features/bookings/repository";
import {getDatabaseUrl} from "@/lib/database-url";

config({path: resolve(process.cwd(), ".env.local")});
config({path: resolve(process.cwd(), ".env")});

const SESSION_ID = "stripe-payment-test-2026-09-21";
const CAPACITY = 2;

export function e2eHasDatabase(): boolean {
  return Boolean(getDatabaseUrl());
}

export async function fillStripePaymentTestSession(): Promise<string[]> {
  const occupancy = await countOccupyingEnrolmentsByDate([SESSION_ID]);
  const taken = occupancy[SESSION_ID] ?? 0;
  const needed = Math.max(0, CAPACITY - taken);
  const created: string[] = [];

  for (let index = 0; index < needed; index += 1) {
    const booking = await createOccupyingBooking(
      {
        firstName: "Ada",
        lastName: "Guest",
        dateOfBirth: "1975-12-10",
        email: `e2e-full-${Date.now()}-${index}@example.test`,
        phone: "+41 79 000 00 00",
        street: "Chemin de la Fenetta 42",
        postalCode: "1752",
        city: "Villars-sur-Glâne",
        country: "CH",
        locale: "fr",
        courseId: "stripe-payment-test",
        courseDateId: SESSION_ID,
        courseTitle: "Test interne — paiement Stripe",
        courseDateStart: "2026-09-21",
        location: "Fribourg",
        amountMinor: 1000,
        currency: "chf",
        paymentProvider: "fake",
        privacyAcceptedAt: new Date(),
      },
      CAPACITY,
    );

    if (booking !== "full") {
      created.push(booking.id);
    }
  }

  return created;
}

export async function releaseSeededBookings(ids: readonly string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  const db = getDb();
  for (const id of ids) {
    await db.delete(bookings).where(eq(bookings.id, id));
  }
}

export const stripePaymentTestSessionId = SESSION_ID;

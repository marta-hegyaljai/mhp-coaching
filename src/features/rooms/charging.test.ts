import {afterAll, describe, expect, it} from "vitest";
import {inArray} from "drizzle-orm";

import {closeDb, getDb} from "@/db";
import {roomBookings, roomNotifications, roomStatements, rooms} from "@/db/schema";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {normalizeEmail} from "@/features/auth/email";
import {hashPassword} from "@/features/auth/password";
import {insertUser, listAuditForUser} from "@/features/auth/repository";
import {FAKE_DECLINE_LAST4} from "@/features/payments/fake/billing-setup";
import {applyStatementPaymentEvent, chargeStatement} from "@/features/rooms/charging";
import {createRoom} from "@/features/rooms/inventory";
import {savePaymentMethodDisplay} from "@/features/rooms/payment-method";
import {quoteRoomBooking} from "@/features/rooms/pricing";
import {assertNoPrivateNoteMaterial} from "@/features/rooms/privacy";
import {insertConfirmedBooking} from "@/features/rooms/repository";
import {sendDueRoomReminders} from "@/features/rooms/reminders";
import {finalizeUserMonth} from "@/features/rooms/statements";
import {zurichLocalToUtc} from "@/features/rooms/timezone";
import {getDatabaseUrl} from "@/lib/database-url";

const hasDatabase = Boolean(getDatabaseUrl());
process.env.ROOM_NOTE_ENCRYPTION_KEY ??=
  "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
process.env.PAYMENT_PROVIDER = "fake";
process.env.VERCEL_ENV = "";

const now = new Date("2026-09-14T06:00:00.000Z");
const closedMonth = {year: 2026, month: 8};

describe.skipIf(!hasDatabase)("room statement charging", () => {
  const createdRoomIds: string[] = [];
  const createdUserIds: string[] = [];

  afterAll(async () => {
    const db = getDb();
    if (createdUserIds.length > 0) {
      await db.delete(roomNotifications).where(inArray(roomNotifications.userId, createdUserIds));
      await db.delete(roomStatements).where(inArray(roomStatements.userId, createdUserIds));
    }
    if (createdRoomIds.length > 0) {
      await db.delete(roomBookings).where(inArray(roomBookings.roomId, createdRoomIds));
      await db.delete(rooms).where(inArray(rooms.id, createdRoomIds));
    }
    await closeDb();
  });

  async function createAdmin() {
    const email = `${Date.now()}-${Math.random().toString(16).slice(2)}@admin.test`;
    const user = await insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Room",
      lastName: "Admin",
      locale: "en",
      isAdmin: true,
      passwordHash: await hashPassword("admin-password-12"),
      emailVerifiedAt: new Date(),
    });
    createdUserIds.push(user.id);
    return user;
  }

  async function createTherapist(label: string) {
    const email = `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}@user.test`;
    const user = await insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Theo",
      lastName: label,
      locale: "en",
      isAdmin: false,
      roomBookingEnabled: true,
      passwordHash: await hashPassword("user-password-12"),
      emailVerifiedAt: new Date(),
    });
    createdUserIds.push(user.id);
    return user;
  }

  async function seedClosedBooking(
    admin: Awaited<ReturnType<typeof createAdmin>>,
    therapist: Awaited<ReturnType<typeof createTherapist>>,
  ) {
    const name = `Charge ${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const created = await createRoom({
      actor: admin,
      name,
      description: "",
      hourlyRateMinor: 4000,
    });
    createdRoomIds.push(created.id);
    const start = zurichLocalToUtc("2026-08-12", "10:00");
    const end = zurichLocalToUtc("2026-08-12", "11:00");
    if (!start.ok || !end.ok) {
      throw new Error("invalid fixture time");
    }
    const quote = quoteRoomBooking({hourlyRateMinor: 4000, durationMinutes: 60, discountPercent: 0});
    const booking = await insertConfirmedBooking({
      roomId: created.id,
      userId: therapist.id,
      createdByUserId: admin.id,
      startsAt: start.instant,
      endsAt: end.instant,
      roomName: name,
      ...quote,
    });
    return {booking, quote};
  }

  it("charges a finalized statement once from the stored total", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("charge");
    const {quote} = await seedClosedBooking(admin, therapist);
    await savePaymentMethodDisplay({
      actor: therapist,
      userId: therapist.id,
      method: {
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2030,
        stripeCustomerId: `cus_fake_${therapist.id}`,
        stripePaymentMethodId: `pm_fake_${therapist.id}`,
      },
    });

    const finalized = await finalizeUserMonth({
      actor: admin,
      userId: therapist.id,
      month: closedMonth,
      now,
    });
    expect(finalized.statement.totalMinor).toBe(quote.amountMinor);

    const first = await chargeStatement({actor: admin, statementId: finalized.statement.id});
    expect(first.status).toBe("PAID");
    expect(first.statement.totalMinor).toBe(quote.amountMinor);

    const second = await chargeStatement({actor: admin, statementId: finalized.statement.id});
    expect(second.status).toBe("PAID");
    expect(second.changed).toBe(false);

    const replay = await applyStatementPaymentEvent({
      statementId: finalized.statement.id,
      type: "succeeded",
      providerReference: first.statement.stripePaymentIntentId,
    });
    expect(replay.status).toBe("PAID");
    expect(replay.changed).toBe(false);

    const failedReplay = await applyStatementPaymentEvent({
      statementId: finalized.statement.id,
      type: "failed",
      failureCode: "card_declined",
    });
    expect(failedReplay.status).toBe("PAID");

    const audit = await listAuditForUser(therapist.id);
    expect(audit.some((row) => row.action === AUDIT_ACTIONS.ROOM_STATEMENT_PAID)).toBe(true);
    expect(audit.every((row) => row.action !== "USER_DISABLED")).toBe(true);
    assertNoPrivateNoteMaterial(first.statement);
  });

  it("records a failed fake charge without disabling access and stays retryable", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("decline");
    await seedClosedBooking(admin, therapist);
    await savePaymentMethodDisplay({
      actor: therapist,
      userId: therapist.id,
      method: {
        brand: "visa",
        last4: FAKE_DECLINE_LAST4,
        expMonth: 12,
        expYear: 2030,
        stripeCustomerId: `cus_fake_${therapist.id}`,
        stripePaymentMethodId: `pm_fake_${therapist.id}`,
      },
    });
    const finalized = await finalizeUserMonth({
      actor: admin,
      userId: therapist.id,
      month: closedMonth,
      now,
    });
    const failed = await chargeStatement({actor: admin, statementId: finalized.statement.id});
    expect(failed.status).toBe("PAYMENT_FAILED");
    expect(failed.statement.failureCode).toBe("card_declined");

    await savePaymentMethodDisplay({
      actor: therapist,
      userId: therapist.id,
      method: {
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2030,
        stripeCustomerId: `cus_fake_${therapist.id}`,
        stripePaymentMethodId: `pm_fake_${therapist.id}`,
      },
    });
    const retried = await chargeStatement({actor: admin, statementId: finalized.statement.id});
    expect(retried.status).toBe("PAID");
  });

  it("rejects concurrent second charges while one attempt is claimed", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("race");
    await seedClosedBooking(admin, therapist);
    await savePaymentMethodDisplay({
      actor: therapist,
      userId: therapist.id,
      method: {
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2030,
        stripeCustomerId: `cus_fake_${therapist.id}`,
        stripePaymentMethodId: `pm_fake_${therapist.id}`,
      },
    });
    const finalized = await finalizeUserMonth({
      actor: admin,
      userId: therapist.id,
      month: closedMonth,
      now,
    });
    const [a, b] = await Promise.allSettled([
      chargeStatement({actor: admin, statementId: finalized.statement.id}),
      chargeStatement({actor: admin, statementId: finalized.statement.id}),
    ]);
    const paid = [a, b].filter(
      (result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof chargeStatement>>> =>
        result.status === "fulfilled" && result.value.status === "PAID",
    );
    expect(paid.length).toBeGreaterThanOrEqual(1);
    const {findStatementById} = await import("@/features/rooms/statement-repository");
    const stored = await findStatementById(finalized.statement.id);
    expect(stored?.status).toBe("PAID");
    expect(stored?.chargeAttempt).toBe(1);
  });

  it("marks a zero-total statement paid without a card", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("zero");
    const finalized = await finalizeUserMonth({
      actor: admin,
      userId: therapist.id,
      month: closedMonth,
      now,
    });
    expect(finalized.statement.totalMinor).toBe(0);
    const charged = await chargeStatement({actor: admin, statementId: finalized.statement.id});
    expect(charged.status).toBe("PAID");
  });

  it("sends a reminder at most once for a booking inside the notice window", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("remind");
    const name = `Remind ${Date.now()}`;
    const created = await createRoom({
      actor: admin,
      name,
      description: "",
      hourlyRateMinor: 4000,
    });
    createdRoomIds.push(created.id);
    const start = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const quote = quoteRoomBooking({hourlyRateMinor: 4000, durationMinutes: 60, discountPercent: 0});
    const booking = await insertConfirmedBooking({
      roomId: created.id,
      userId: therapist.id,
      createdByUserId: admin.id,
      startsAt: start,
      endsAt: end,
      roomName: name,
      ...quote,
    });

    const first = await sendDueRoomReminders(now);
    expect(first.considered).toBeGreaterThanOrEqual(1);
    const second = await sendDueRoomReminders(now);
    const rows = await getDb()
      .select()
      .from(roomNotifications)
      .where(inArray(roomNotifications.bookingId, [booking.id]));
    const reminders = rows.filter((row) => row.kind === "BOOKING_REMINDER");
    expect(reminders).toHaveLength(1);
    expect(second.considered).toBeGreaterThanOrEqual(1);
    assertNoPrivateNoteMaterial(reminders[0]);
  });
});

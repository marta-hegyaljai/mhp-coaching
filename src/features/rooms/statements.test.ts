import {afterAll, describe, expect, it} from "vitest";
import {inArray} from "drizzle-orm";

import {closeDb, getDb} from "@/db";
import {roomBookings, roomStatements, rooms} from "@/db/schema";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {normalizeEmail} from "@/features/auth/email";
import {hashPassword} from "@/features/auth/password";
import {insertUser, listAuditForUser} from "@/features/auth/repository";
import {RoomError} from "@/features/rooms/errors";
import {createRoom, editRoom} from "@/features/rooms/inventory";
import {quoteRoomBooking} from "@/features/rooms/pricing";
import {assertNoPrivateNoteMaterial} from "@/features/rooms/privacy";
import {saveOwnPrivateNote} from "@/features/rooms/private-notes";
import {insertConfirmedBooking} from "@/features/rooms/repository";
import {statementDetailToCsv} from "@/features/rooms/statement-csv";
import {
  addStatementAdjustment,
  finalizeUserMonth,
  loadStatementDetail,
  previewFinalize,
  publicStatementProjection,
  statementTotalsMatch,
} from "@/features/rooms/statements";
import {zurichLocalToUtc} from "@/features/rooms/timezone";
import {getDatabaseUrl} from "@/lib/database-url";

const hasDatabase = Boolean(getDatabaseUrl());
process.env.ROOM_NOTE_ENCRYPTION_KEY ??=
  "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";

const now = new Date("2026-09-14T06:00:00.000Z");
const closedMonth = {year: 2026, month: 8};

describe.skipIf(!hasDatabase)("monthly room statements", () => {
  const createdRoomIds: string[] = [];
  const createdUserIds: string[] = [];

  afterAll(async () => {
    const db = getDb();
    if (createdUserIds.length > 0) {
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
    hourlyRateMinor = 4000,
  ) {
    const name = `Statement ${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const created = await createRoom({
      actor: admin,
      name,
      description: "",
      hourlyRateMinor,
    });
    createdRoomIds.push(created.id);
    const start = zurichLocalToUtc("2026-08-12", "10:00");
    const end = zurichLocalToUtc("2026-08-12", "11:00");
    if (!start.ok || !end.ok) {
      throw new Error("invalid fixture time");
    }
    const quote = quoteRoomBooking({hourlyRateMinor, durationMinutes: 60, discountPercent: 0});
    const booking = await insertConfirmedBooking({
      roomId: created.id,
      userId: therapist.id,
      createdByUserId: admin.id,
      startsAt: start.instant,
      endsAt: end.instant,
      roomName: name,
      ...quote,
    });
    return {room: {id: created.id, name}, booking, quote};
  }

  it("finalizes a closed month idempotently and keeps booking lines immutable", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("stmt");
    const {booking, quote, room} = await seedClosedBooking(admin, therapist);

    const preview = await previewFinalize({
      actor: admin,
      userId: therapist.id,
      month: closedMonth,
      now,
    });
    expect(preview.canFinalize).toBe(true);
    expect(preview.open).toBe(false);
    expect(preview.usage.billedAmountMinor).toBe(quote.amountMinor);
    expect(preview.warnings).toContain("noPaymentMethod");

    const first = await finalizeUserMonth({
      actor: admin,
      userId: therapist.id,
      month: closedMonth,
      now,
    });
    expect(first.statement.status).toBe("FINALIZED");
    expect(first.statement.totalMinor).toBe(quote.amountMinor);
    expect(statementTotalsMatch(first)).toBe(true);
    expect(first.lines).toHaveLength(1);
    expect(first.lines[0]?.bookingId).toBe(booking.id);

    const second = await finalizeUserMonth({
      actor: admin,
      userId: therapist.id,
      month: closedMonth,
      now,
    });
    expect(second.statement.id).toBe(first.statement.id);
    expect(second.statement.totalMinor).toBe(first.statement.totalMinor);

    await editRoom({
      actor: admin,
      roomId: room.id,
      name: room.name,
      description: "",
      hourlyRateMinor: 9900,
    });

    const afterPriceChange = await loadStatementDetail({
      actor: admin,
      statementId: first.statement.id,
    });
    expect(afterPriceChange.statement.totalMinor).toBe(quote.amountMinor);
    expect(afterPriceChange.lines[0]?.amountMinor).toBe(quote.amountMinor);

    const adjusted = await addStatementAdjustment({
      actor: admin,
      statementId: first.statement.id,
      amountMinor: -500,
      reason: "Goodwill credit for delayed access",
    });
    expect(adjusted.lines).toHaveLength(2);
    expect(adjusted.statement.totalMinor).toBe(quote.amountMinor - 500);
    expect(adjusted.lines[0]?.amountMinor).toBe(quote.amountMinor);
    expect(statementTotalsMatch(adjusted)).toBe(true);

    const events = await listAuditForUser(therapist.id);
    expect(events.some((event) => event.action === AUDIT_ACTIONS.ROOM_STATEMENT_FINALIZED)).toBe(
      true,
    );
    expect(events.some((event) => event.action === AUDIT_ACTIONS.ROOM_STATEMENT_ADJUSTED)).toBe(
      true,
    );

    const csv = statementDetailToCsv(adjusted);
    assertNoPrivateNoteMaterial(csv);
    assertNoPrivateNoteMaterial(publicStatementProjection(adjusted));
    expect(csv).toContain("ADJUSTMENT");
    expect(csv).toContain("Goodwill credit for delayed access");
  });

  it("rejects open-month finalization, therapists, and leaking private notes", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("open-stmt");
    const other = await createTherapist("other-stmt");
    const {booking} = await seedClosedBooking(admin, therapist);

    await expect(
      finalizeUserMonth({
        actor: therapist,
        userId: therapist.id,
        month: closedMonth,
        now,
      }),
    ).rejects.toMatchObject({code: "forbidden"});

    await expect(
      finalizeUserMonth({
        actor: admin,
        userId: therapist.id,
        month: {year: 2026, month: 9},
        now,
      }),
    ).rejects.toMatchObject({code: "monthStillOpen"});

    const note = "Do not bill the patient named in this note";
    await saveOwnPrivateNote(therapist, booking.id, note);

    const detail = await finalizeUserMonth({
      actor: admin,
      userId: therapist.id,
      month: closedMonth,
      now,
    });
    expect(() => assertNoPrivateNoteMaterial(publicStatementProjection(detail), note)).not.toThrow();
    expect(() => assertNoPrivateNoteMaterial(statementDetailToCsv(detail), note)).not.toThrow();

    await expect(
      loadStatementDetail({actor: other, statementId: detail.statement.id}),
    ).rejects.toBeInstanceOf(RoomError);

    const zero = await finalizeUserMonth({
      actor: admin,
      userId: other.id,
      month: closedMonth,
      now,
    });
    expect(zero.statement.totalMinor).toBe(0);
    expect(zero.lines).toHaveLength(0);
    expect(statementTotalsMatch(zero)).toBe(true);
  });
});

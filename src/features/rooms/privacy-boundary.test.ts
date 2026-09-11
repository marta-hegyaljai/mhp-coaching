import {afterAll, describe, expect, it, vi} from "vitest";
import {inArray} from "drizzle-orm";

import {closeDb, getDb} from "@/db";
import {roomBookings, rooms} from "@/db/schema";
import {normalizeEmail} from "@/features/auth/email";
import {hashPassword} from "@/features/auth/password";
import {insertUser} from "@/features/auth/repository";
import {therapistAvailability} from "@/features/rooms/availability";
import {auditBookingSnapshot, bookingHistorySnapshot} from "@/features/rooms/billing";
import {createRoom} from "@/features/rooms/inventory";
import {getAdminRoomBooking} from "@/features/rooms/lifecycle";
import {listMyRoomBookings} from "@/features/rooms/my-bookings";
import {assertLogHasNoPrivateNote, assertNoPrivateNoteMaterial} from "@/features/rooms/privacy";
import {saveOwnPrivateNote} from "@/features/rooms/private-notes";
import {reserveRoom} from "@/features/rooms/reservations";
import {listAdminBookingsPage, listBookingEvents} from "@/features/rooms/repository";
import {bookingsToCsv} from "@/features/staff/csv";
import {getDatabaseUrl} from "@/lib/database-url";

const hasDatabase = Boolean(getDatabaseUrl());
process.env.ROOM_NOTE_ENCRYPTION_KEY ??=
  "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";

const now = new Date("2026-09-14T06:00:00.000Z");
const date = "2026-09-21";

describe.skipIf(!hasDatabase)("private-note exclusion", () => {
  const createdRoomIds: string[] = [];

  afterAll(async () => {
    if (createdRoomIds.length > 0) {
      const db = getDb();
      await db.delete(roomBookings).where(inArray(roomBookings.roomId, createdRoomIds));
      await db.delete(rooms).where(inArray(rooms.id, createdRoomIds));
    }
    await closeDb();
  });

  async function createAdmin() {
    const email = `${Date.now()}-${Math.random().toString(16).slice(2)}@admin.test`;
    return insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Room",
      lastName: "Admin",
      locale: "en",
      isAdmin: true,
      passwordHash: await hashPassword("admin-password-12"),
      emailVerifiedAt: new Date(),
    });
  }

  async function createTherapist(label: string) {
    const email = `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}@user.test`;
    return insertUser({
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
  }

    it("keeps private-note plaintext out of calendar, admin, billing, export and logs", async () => {
    const admin = await createAdmin();
    const owner = await createTherapist("boundary");
    const created = await createRoom({
      actor: admin,
      name: `Boundary ${Date.now()}`,
      description: "",
      hourlyRateMinor: 4000,
    });
    createdRoomIds.push(created.id);
    const booking = await reserveRoom({
      actor: owner,
      roomId: created.id,
      date,
      start: "10:00",
      end: "11:30",
      now,
    });
    const secret = `NOTE-SECRET-${booking.id}`;
    await saveOwnPrivateNote(owner, booking.id, secret);

    const errors: unknown[][] = [];
    const errorSpy = vi.spyOn(console, "error").mockImplementation((...args) => {
      errors.push(args);
    });

    const calendar = await therapistAvailability({
      actor: owner,
      view: "day",
      date,
      roomId: created.id,
      now,
    });
    const adminBooking = await getAdminRoomBooking(admin, booking.id);
    const ownLists = await listMyRoomBookings(owner, now);
    const adminList = await listAdminBookingsPage({q: owner.email, status: "all", page: 1});
    const events = await listBookingEvents(booking.id);
    const history = bookingHistorySnapshot(adminBooking);
    const audit = auditBookingSnapshot(adminBooking);
    const csv = bookingsToCsv([]);

    for (const payload of [calendar, adminBooking, ownLists, adminList, events, history, audit, csv]) {
      assertNoPrivateNoteMaterial(payload, secret);
    }
    assertLogHasNoPrivateNote(errors, secret);
    expect(JSON.stringify(calendar.slots[0] ?? {})).not.toContain("ciphertext");
    expect(adminList.rows[0]?.booking).not.toHaveProperty("note");

    errorSpy.mockRestore();
  });
});

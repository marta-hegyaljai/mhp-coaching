import {afterAll, describe, expect, it} from "vitest";
import {inArray} from "drizzle-orm";

import {closeDb, getDb} from "@/db";
import {roomBookings, rooms} from "@/db/schema";
import {normalizeEmail} from "@/features/auth/email";
import {hashPassword} from "@/features/auth/password";
import {insertUser} from "@/features/auth/repository";
import {createRoom} from "@/features/rooms/inventory";
import {cancelRoomBooking} from "@/features/rooms/lifecycle";
import {reserveRoom} from "@/features/rooms/reservations";
import {listAdminBookingMetrics, listAdminBookingsPage} from "@/features/rooms/repository";
import {getDatabaseUrl} from "@/lib/database-url";

const hasDatabase = Boolean(getDatabaseUrl());
const now = new Date("2026-09-14T06:00:00.000Z");

describe.skipIf(!hasDatabase)("admin booking list", () => {
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
      firstName: "Ada",
      lastName: label,
      locale: "en",
      isAdmin: false,
      roomBookingEnabled: true,
      passwordHash: await hashPassword("user-password-12"),
      emailVerifiedAt: new Date(),
    });
  }

  it("hides cancelled rows by default, includes them on request, and can list one Zurich day", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("list");
    const created = await createRoom({
      actor: admin,
      name: `Admin list ${Date.now()}`,
      description: "",
      hourlyRateMinor: 4000,
    });
    createdRoomIds.push(created.id);

    const today = await reserveRoom({
      actor: therapist,
      roomId: created.id,
      date: "2026-09-14",
      start: "10:00",
      end: "11:00",
      now,
    });
    const later = await reserveRoom({
      actor: therapist,
      roomId: created.id,
      date: "2026-09-21",
      start: "10:00",
      end: "11:00",
      now,
    });
    await cancelRoomBooking({actor: therapist, bookingId: later.id, now});

    const confirmed = await listAdminBookingsPage({
      q: therapist.email,
      status: "CONFIRMED",
      page: 1,
    });
    expect(confirmed.rows.map((row) => row.booking.id)).toEqual([today.id]);

    const withCancelled = await listAdminBookingsPage({
      q: therapist.email,
      status: "all",
      page: 1,
    });
    expect(withCancelled.rows.map((row) => row.booking.id).sort()).toEqual(
      [today.id, later.id].sort(),
    );

    const day = await listAdminBookingsPage({
      q: therapist.email,
      status: "all",
      page: 1,
      day: "2026-09-14",
      order: "asc",
    });
    expect(day.rows.map((row) => row.booking.id)).toEqual([today.id]);
    expect(day.rows[0]?.owner.email).toBe(therapist.email);

    const emptyDay = await listAdminBookingsPage({
      q: therapist.email,
      status: "all",
      page: 1,
      day: "2026-09-15",
    });
    expect(emptyDay.total).toBe(0);

    const metrics = await listAdminBookingMetrics(now);
    expect(metrics.today).toBeGreaterThanOrEqual(1);
    expect(metrics.confirmed).toBeGreaterThanOrEqual(1);
    expect(metrics.cancelled).toBeGreaterThanOrEqual(1);
  });
});

import {afterAll, describe, expect, it} from "vitest";
import {inArray} from "drizzle-orm";

import {closeDb, getDb} from "@/db";
import {roomBookings, rooms} from "@/db/schema";
import {normalizeEmail} from "@/features/auth/email";
import {hashPassword} from "@/features/auth/password";
import {insertUser, findUserById} from "@/features/auth/repository";
import {setUserRoomDiscount} from "@/features/rooms/discounts";
import {RoomError} from "@/features/rooms/errors";
import {createRoom, editRoom} from "@/features/rooms/inventory";
import {
  cancelRoomBooking,
  waiveRoomBooking,
} from "@/features/rooms/lifecycle";
import {assertNoPrivateNoteMaterial} from "@/features/rooms/privacy";
import {saveOwnPrivateNote} from "@/features/rooms/private-notes";
import {reserveRoom} from "@/features/rooms/reservations";
import {openMonthUserTotalsToCsv} from "@/features/rooms/usage-csv";
import {loadOpenMonthUsage, loadOwnOpenMonthUsage, usageTotalsMatch} from "@/features/rooms/usage";
import {getDatabaseUrl} from "@/lib/database-url";

const hasDatabase = Boolean(getDatabaseUrl());
process.env.ROOM_NOTE_ENCRYPTION_KEY ??=
  "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";

const now = new Date("2026-09-14T06:00:00.000Z");
const inMonth = "2026-09-21";
const nextMonth = "2026-10-05";
const nearDate = "2026-09-15";

describe.skipIf(!hasDatabase)("open-month room usage", () => {
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

  async function seedRoom(
    admin: Awaited<ReturnType<typeof createAdmin>>,
    hourlyRateMinor = 4000,
  ) {
    const name = `Usage ${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const created = await createRoom({
      actor: admin,
      name,
      description: "",
      hourlyRateMinor,
    });
    createdRoomIds.push(created.id);
    return {id: created.id, name};
  }

  it("snapshots the current discount and ignores later price or discount changes", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("snap");
    const room = await seedRoom(admin, 4000);
    const discounted = await setUserRoomDiscount({
      actor: admin,
      targetUserId: therapist.id,
      discountPercent: 25,
    });

    const first = await reserveRoom({
      actor: discounted,
      roomId: room.id,
      date: inMonth,
      start: "10:00",
      end: "11:00",
      now,
    });
    expect(first.discountPercent).toBe(25);
    expect(first.baseHourlyRateMinor).toBe(4000);
    expect(first.effectiveHourlyRateMinor).toBe(3000);
    expect(first.amountMinor).toBe(3000);

    await setUserRoomDiscount({
      actor: admin,
      targetUserId: therapist.id,
      discountPercent: 0,
    });
    await editRoom({
      actor: admin,
      roomId: room.id,
      name: room.name,
      description: "",
      hourlyRateMinor: 5000,
    });

    const second = await reserveRoom({
      actor: (await findUserById(therapist.id))!,
      roomId: room.id,
      date: inMonth,
      start: "14:00",
      end: "15:00",
      now,
    });
    expect(second.discountPercent).toBe(0);
    expect(second.baseHourlyRateMinor).toBe(5000);
    expect(second.amountMinor).toBe(5000);
    expect(first.amountMinor).toBe(3000);
    expect(first.discountPercent).toBe(25);
  });

  it("reconciles completed use, free cancel, late charge and waiver for one therapist", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("recon");
    const other = await createTherapist("other");
    const room = await seedRoom(admin, 4000);

    const usage = await reserveRoom({
      actor: therapist,
      roomId: room.id,
      date: inMonth,
      start: "08:00",
      end: "09:30",
      now,
    });
    const free = await reserveRoom({
      actor: therapist,
      roomId: room.id,
      date: inMonth,
      start: "10:00",
      end: "11:00",
      now,
    });
    const late = await reserveRoom({
      actor: therapist,
      roomId: room.id,
      date: nearDate,
      start: "10:00",
      end: "11:00",
      now,
    });
    const next = await reserveRoom({
      actor: therapist,
      roomId: room.id,
      date: nextMonth,
      start: "10:00",
      end: "11:00",
      now,
    });
    const stranger = await reserveRoom({
      actor: other,
      roomId: room.id,
      date: inMonth,
      start: "16:00",
      end: "17:00",
      now,
    });

    await cancelRoomBooking({actor: therapist, bookingId: free.id, now});
    const lateCancelled = await cancelRoomBooking({actor: therapist, bookingId: late.id, now});
    expect(lateCancelled.billingOutcome).toBe("LATE_CANCELLATION");
    const waived = await waiveRoomBooking({actor: admin, bookingId: lateCancelled.id});
    expect(waived.billingOutcome).toBe("WAIVED");

    const own = await loadOwnOpenMonthUsage(therapist, now);
    expect(own.userId).toBe(therapist.id);
    expect(own.lines.map((line) => line.bookingId)).toEqual(
      expect.arrayContaining([usage.id, free.id, late.id]),
    );
    expect(own.lines.map((line) => line.bookingId)).not.toContain(next.id);
    expect(own.lines.map((line) => line.bookingId)).not.toContain(stranger.id);
    expect(own.billedMinutes).toBe(90);
    expect(own.billedAmountMinor).toBe(6000);
    expect(own.open).toBe(true);

    const secret = `NOTE-SECRET-${usage.id}`;
    await saveOwnPrivateNote(therapist, usage.id, secret);
    assertNoPrivateNoteMaterial(own, secret);

    const adminReport = await loadOpenMonthUsage({actor: admin, now});
    expect(usageTotalsMatch(adminReport)).toBe(true);
    const therapistRow = adminReport.users.find((row) => row.userId === therapist.id);
    const otherRow = adminReport.users.find((row) => row.userId === other.id);
    expect(therapistRow?.billedAmountMinor).toBe(6000);
    expect(otherRow?.billedAmountMinor).toBe(4000);

    const csv = openMonthUserTotalsToCsv(adminReport);
    expect(csv).toContain(therapist.email);
    expect(csv).toContain("6000");
    expect(csv).toContain("TOTALS");
    expect(csv).not.toContain(secret);
    expect(csv).not.toContain("privateNote");
    assertNoPrivateNoteMaterial(csv, secret);
    const therapistCsvLine = csv.split("\n").find((line) => line.includes(therapist.email));
    expect(therapistCsvLine).toContain(String(therapistRow?.billedMinutes));
    expect(therapistCsvLine).toContain(String(therapistRow?.billedAmountMinor));

    await expect(loadOpenMonthUsage({actor: therapist, now})).resolves.toMatchObject({
      users: [expect.objectContaining({userId: therapist.id})],
    });
    await expect(
      loadOpenMonthUsage({actor: therapist, now, userId: other.id}),
    ).rejects.toBeInstanceOf(RoomError);
  });
});

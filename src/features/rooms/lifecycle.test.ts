import {afterAll, describe, expect, it} from "vitest";
import {inArray} from "drizzle-orm";

import {closeDb, getDb} from "@/db";
import {roomBookings, rooms} from "@/db/schema";
import {normalizeEmail} from "@/features/auth/email";
import {hashPassword} from "@/features/auth/password";
import {insertUser} from "@/features/auth/repository";
import {chargeableAmountMinor} from "@/features/rooms/billing";
import {RoomError} from "@/features/rooms/errors";
import {createRoom} from "@/features/rooms/inventory";
import {
  cancelRoomBooking,
  createRoomBookingForUser,
  moveRoomBooking,
  waiveRoomBooking,
} from "@/features/rooms/lifecycle";
import {listMyRoomBookings} from "@/features/rooms/my-bookings";
import {reserveRoom} from "@/features/rooms/reservations";
import {
  findBookingById,
  listBookingEvents,
  overlappingConfirmedBookings,
} from "@/features/rooms/repository";
import {getDatabaseUrl} from "@/lib/database-url";

const hasDatabase = Boolean(getDatabaseUrl());
const farNow = new Date("2026-09-14T06:00:00.000Z");
const farDate = "2026-09-21";
const nearNow = new Date("2026-09-14T06:00:00.000Z");
const nearDate = "2026-09-15";

describe.skipIf(!hasDatabase)("room booking lifecycle", () => {
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

  async function createTherapist(label: string, roomBookingEnabled = true) {
    const email = `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}@user.test`;
    return insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Theo",
      lastName: label,
      locale: "en",
      isAdmin: false,
      roomBookingEnabled,
      passwordHash: await hashPassword("user-password-12"),
      emailVerifiedAt: new Date(),
    });
  }

  async function seedRoom(admin: Awaited<ReturnType<typeof createAdmin>>, name: string) {
    const created = await createRoom({
      actor: admin,
      name,
      description: "",
      hourlyRateMinor: 4000,
    });
    createdRoomIds.push(created.id);
    return created;
  }

  it("moves outside the notice window in place and keeps the same id", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("move-free");
    const {id: roomId} = await seedRoom(admin, `Move free ${Date.now()}`);
    const booking = await reserveRoom({
      actor: therapist,
      roomId,
      date: farDate,
      start: "10:00",
      end: "11:00",
      now: farNow,
    });

    const moved = await moveRoomBooking({
      actor: therapist,
      bookingId: booking.id,
      roomId,
      date: farDate,
      start: "14:00",
      end: "15:30",
      now: farNow,
    });

    expect(moved.kind).toBe("moved");
    if (moved.kind !== "moved") {
      return;
    }
    expect(moved.booking.id).toBe(booking.id);
    expect(moved.booking.status).toBe("CONFIRMED");
    expect(moved.booking.durationMinutes).toBe(90);
    expect(moved.booking.amountMinor).toBe(6000);
    const events = await listBookingEvents(booking.id);
    expect(events.map((event) => event.action)).toContain("CREATED");
    expect(events.map((event) => event.action)).toContain("MOVED");
    expect(JSON.stringify(events)).not.toContain(admin.email);
  });

  it("treats an owner move inside the notice window as cancel-and-rebook", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("move-late");
    const {id: roomId} = await seedRoom(admin, `Move late ${Date.now()}`);
    const booking = await reserveRoom({
      actor: therapist,
      roomId,
      date: nearDate,
      start: "10:00",
      end: "11:00",
      now: nearNow,
    });

    const moved = await moveRoomBooking({
      actor: therapist,
      bookingId: booking.id,
      roomId,
      date: nearDate,
      start: "14:00",
      end: "15:00",
      now: nearNow,
    });

    expect(moved.kind).toBe("replaced");
    if (moved.kind !== "replaced") {
      return;
    }
    expect(moved.original.id).toBe(booking.id);
    expect(moved.original.status).toBe("CANCELLED");
    expect(moved.original.billingOutcome).toBe("LATE_CANCELLATION");
    expect(moved.original.amountMinor).toBe(4000);
    expect(chargeableAmountMinor(moved.original)).toBe(4000);
    expect(moved.original.successorBookingId).toBe(moved.booking.id);
    expect(moved.booking.status).toBe("CONFIRMED");
    expect(moved.booking.billingOutcome).toBe("USAGE");
    expect(moved.booking.id).not.toBe(booking.id);
    expect(await findBookingById(booking.id)).toBeTruthy();

    const originalEvents = await listBookingEvents(booking.id);
    expect(originalEvents.map((event) => event.action)).toEqual(["CREATED", "CANCELLED"]);
    const newEvents = await listBookingEvents(moved.booking.id);
    expect(newEvents.map((event) => event.action)).toEqual(["CREATED"]);
  });

  it("releases inventory on free cancellation with no charge", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("cancel-free");
    const {id: roomId} = await seedRoom(admin, `Cancel free ${Date.now()}`);
    const booking = await reserveRoom({
      actor: therapist,
      roomId,
      date: farDate,
      start: "10:00",
      end: "11:00",
      now: farNow,
    });

    const cancelled = await cancelRoomBooking({
      actor: therapist,
      bookingId: booking.id,
      now: farNow,
    });
    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.billingOutcome).toBe("FREE_CANCELLATION");
    expect(chargeableAmountMinor(cancelled)).toBe(0);
    expect(await findBookingById(booking.id)).toBeTruthy();

    const leftover = await overlappingConfirmedBookings({
      roomId,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
    });
    expect(leftover).toEqual([]);

    const second = await reserveRoom({
      actor: therapist,
      roomId,
      date: farDate,
      start: "10:00",
      end: "11:00",
      now: farNow,
    });
    expect(second.id).not.toBe(booking.id);
  });

  it("keeps the snapshot amount on late cancellation and frees the slot", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("cancel-late");
    const {id: roomId} = await seedRoom(admin, `Cancel late ${Date.now()}`);
    const booking = await reserveRoom({
      actor: therapist,
      roomId,
      date: nearDate,
      start: "10:00",
      end: "11:30",
      now: nearNow,
    });

    const cancelled = await cancelRoomBooking({
      actor: therapist,
      bookingId: booking.id,
      now: nearNow,
    });
    expect(cancelled.billingOutcome).toBe("LATE_CANCELLATION");
    expect(cancelled.amountMinor).toBe(6000);
    expect(chargeableAmountMinor(cancelled)).toBe(6000);
    expect(
      await overlappingConfirmedBookings({
        roomId,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
      }),
    ).toEqual([]);
  });

  it("lets an admin create, move, cancel and waive for a room user", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("admin-target");
    const other = await createTherapist("other");
    const courseOnly = await createTherapist("course", false);
    const firstRoom = await seedRoom(admin, `Admin A ${Date.now()}`);
    const secondRoom = await seedRoom(admin, `Admin B ${Date.now()}`);

    const created = await createRoomBookingForUser({
      actor: admin,
      userId: therapist.id,
      roomId: firstRoom.id,
      date: farDate,
      start: "10:00",
      end: "11:00",
      now: farNow,
    });
    expect(created.userId).toBe(therapist.id);
    expect(created.createdByUserId).toBe(admin.id);
    const lists = await listMyRoomBookings(therapist, farNow);
    expect(lists.upcoming.map((item) => item.id)).toContain(created.id);

    const moved = await moveRoomBooking({
      actor: admin,
      bookingId: created.id,
      roomId: secondRoom.id,
      date: farDate,
      start: "14:00",
      end: "15:00",
      now: new Date("2026-09-20T10:00:00.000Z"),
    });
    expect(moved.kind).toBe("moved");
    if (moved.kind === "moved") {
      expect(moved.booking.id).toBe(created.id);
      expect(moved.booking.roomId).toBe(secondRoom.id);
    }

    const nearBooking = await createRoomBookingForUser({
      actor: admin,
      userId: therapist.id,
      roomId: firstRoom.id,
      date: nearDate,
      start: "10:00",
      end: "11:00",
      now: nearNow,
    });
    const cancelled = await cancelRoomBooking({
      actor: admin,
      bookingId: nearBooking.id,
      now: nearNow,
    });
    expect(cancelled.billingOutcome).toBe("LATE_CANCELLATION");
    const waived = await waiveRoomBooking({actor: admin, bookingId: cancelled.id});
    expect(waived.billingOutcome).toBe("WAIVED");
    expect(chargeableAmountMinor(waived)).toBe(0);

    await expect(
      createRoomBookingForUser({
        actor: admin,
        userId: courseOnly.id,
        roomId: firstRoom.id,
        date: farDate,
        start: "16:00",
        end: "17:00",
        now: farNow,
      }),
    ).rejects.toMatchObject({code: "invalidUser"});

    await expect(
      cancelRoomBooking({actor: other, bookingId: created.id, now: farNow}),
    ).rejects.toMatchObject({code: "notFound"});
    await expect(
      cancelRoomBooking({actor: courseOnly, bookingId: created.id, now: farNow}),
    ).rejects.toMatchObject({code: "forbidden"});
    await expect(
      waiveRoomBooking({actor: therapist, bookingId: cancelled.id}),
    ).rejects.toMatchObject({code: "forbidden"});
    await expect(
      createRoomBookingForUser({
        actor: therapist,
        userId: therapist.id,
        roomId: firstRoom.id,
        date: farDate,
        start: "16:00",
        end: "17:00",
        now: farNow,
      }),
    ).rejects.toMatchObject({code: "forbidden"});
  });

  it("rejects owner changes after the start and overlapping destination slots", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("late-owner");
    const {id: roomId} = await seedRoom(admin, `Too late ${Date.now()}`);
    const booking = await reserveRoom({
      actor: therapist,
      roomId,
      date: farDate,
      start: "10:00",
      end: "11:00",
      now: farNow,
    });
    await reserveRoom({
      actor: therapist,
      roomId,
      date: farDate,
      start: "14:00",
      end: "15:00",
      now: farNow,
    });

    await expect(
      moveRoomBooking({
        actor: therapist,
        bookingId: booking.id,
        roomId,
        date: farDate,
        start: "14:00",
        end: "15:00",
        now: farNow,
      }),
    ).rejects.toMatchObject({code: "slotConflict"});

    await expect(
      cancelRoomBooking({
        actor: therapist,
        bookingId: booking.id,
        now: new Date("2026-09-21T10:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(RoomError);

    const events = await listBookingEvents(booking.id);
    expect(events.every((event) => event.before === null || !JSON.stringify(event.before).includes("email"))).toBe(
      true,
    );
  });
});

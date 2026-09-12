import {afterAll, describe, expect, it} from "vitest";
import {inArray} from "drizzle-orm";

import {closeDb, getDb} from "@/db";
import {roomBookings, rooms} from "@/db/schema";
import {normalizeEmail} from "@/features/auth/email";
import {hashPassword} from "@/features/auth/password";
import {insertUser} from "@/features/auth/repository";
import {therapistAvailability} from "@/features/rooms/availability";
import {createRoomBlock} from "@/features/rooms/blocks";
import {createRoom, setRoomActive} from "@/features/rooms/inventory";
import {getMyRoomBooking, listMyRoomBookings} from "@/features/rooms/my-bookings";
import {
  previewReservation,
  previewReservationChoices,
  reserveRoom,
} from "@/features/rooms/reservations";
import {overlappingConfirmedBookings} from "@/features/rooms/repository";
import {saveRoomSettings} from "@/features/rooms/settings";
import {getDatabaseUrl} from "@/lib/database-url";

const hasDatabase = Boolean(getDatabaseUrl());
const now = new Date("2026-09-14T06:00:00.000Z");
const date = "2026-09-21";

describe.skipIf(!hasDatabase)("room reservations", () => {
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

  it("reserves a valid interval with a server-calculated snapshot and lists it", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("owner");
    const {id: roomId} = await seedRoom(admin, `Reserve ${Date.now()}`);

    const booking = await reserveRoom({
      actor: therapist,
      roomId,
      date,
      start: "10:00",
      end: "11:30",
      now,
    });

    expect(booking.status).toBe("CONFIRMED");
    expect(booking.userId).toBe(therapist.id);
    expect(booking.createdByUserId).toBe(therapist.id);
    expect(booking.durationMinutes).toBe(90);
    expect(booking.discountPercent).toBe(0);
    expect(booking.baseHourlyRateMinor).toBe(4000);
    expect(booking.effectiveHourlyRateMinor).toBe(4000);
    expect(booking.amountMinor).toBe(6000);
    expect(booking.currency).toBe("CHF");
    expect(JSON.stringify(booking)).not.toContain("note");

    const lists = await listMyRoomBookings(therapist, now);
    expect(lists.upcoming.map((item) => item.id)).toContain(booking.id);
    expect(lists.upcoming[0]?.amountMinor).toBe(6000);
    expect(JSON.stringify(lists)).not.toContain(admin.email);

    const grid = await therapistAvailability({
      actor: therapist,
      view: "day",
      date,
      roomId,
      now,
    });
    expect(grid.slots.find((slot) => slot.localStart === "10:00")?.state).toBe("my-booking");
    expect(grid.slots.find((slot) => slot.localStart === "10:00")?.ownBookingId).toBe(
      booking.id,
    );
  });

  it("allows retroactive entry while rejecting invalid duration, increment, advance, closed, blocked and disabled rooms", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("rules");
    const {id: roomId} = await seedRoom(admin, `Rules ${Date.now()}`);

    const defaultHours = [
      {weekday: 1, closed: false, startMinute: 7 * 60, endMinute: 21 * 60},
      {weekday: 2, closed: false, startMinute: 7 * 60, endMinute: 21 * 60},
      {weekday: 3, closed: false, startMinute: 7 * 60, endMinute: 21 * 60},
      {weekday: 4, closed: false, startMinute: 7 * 60, endMinute: 21 * 60},
      {weekday: 5, closed: false, startMinute: 7 * 60, endMinute: 21 * 60},
      {weekday: 6, closed: false, startMinute: 8 * 60, endMinute: 18 * 60},
      {weekday: 7, closed: true, startMinute: 0, endMinute: 0},
    ];

    try {
      await saveRoomSettings({
        actor: admin,
        cancellationNoticeHours: 48,
        bookingIntervalMinutes: 30,
        minimumBookingMinutes: 60,
        maximumBookingMinutes: 120,
        maximumAdvanceBookingDays: 14,
        reminderNoticeHours: 24,
        hours: defaultHours,
      });

      await expect(
        reserveRoom({actor: therapist, roomId, date, start: "10:00", end: "10:30", now}),
      ).rejects.toMatchObject({code: "invalidDuration"});
      await expect(
        reserveRoom({actor: therapist, roomId, date, start: "10:10", end: "11:10", now}),
      ).rejects.toMatchObject({code: "invalidIncrement"});
      const retroactivePreview = await previewReservation({
        actor: therapist,
        roomId,
        date: "2026-09-10",
        start: "10:00",
        end: "11:00",
        now,
      });
      expect(retroactivePreview.start).toBe("10:00");

      const retroactive = await reserveRoom({
        actor: therapist,
        roomId,
        date: "2026-09-10",
        start: "10:00",
        end: "11:00",
        now,
      });
      expect(retroactive.startsAt.getTime()).toBeLessThan(now.getTime());
      const ownBookings = await listMyRoomBookings(therapist, now);
      expect(ownBookings.history.map((booking) => booking.id)).toContain(retroactive.id);
      await saveRoomSettings({
        actor: admin,
        cancellationNoticeHours: 48,
        bookingIntervalMinutes: 30,
        minimumBookingMinutes: 60,
        maximumBookingMinutes: 120,
        maximumAdvanceBookingDays: 14,
        reminderNoticeHours: 24,
        hours: defaultHours,
      });
      await expect(
        reserveRoom({
          actor: therapist,
          roomId,
          date: "2026-10-20",
          start: "10:00",
          end: "11:00",
          now,
        }),
      ).rejects.toMatchObject({code: "tooFar"});
      await expect(
        reserveRoom({
          actor: therapist,
          roomId,
          date: "2026-09-27",
          start: "10:00",
          end: "11:00",
          now,
        }),
      ).rejects.toMatchObject({code: "closedHours"});

      await createRoomBlock({
        actor: admin,
        roomId,
        startLocal: `${date}T14:00`,
        endLocal: `${date}T15:00`,
        reason: "Closed for paint",
      });
      await expect(
        reserveRoom({actor: therapist, roomId, date, start: "14:00", end: "15:00", now}),
      ).rejects.toMatchObject({code: "blocked"});

      await setRoomActive({actor: admin, roomId, active: false});
      await expect(
        reserveRoom({actor: therapist, roomId, date, start: "10:00", end: "11:00", now}),
      ).rejects.toMatchObject({code: "disabledRoom"});

      const leftover = await overlappingConfirmedBookings({
        roomId,
        startsAt: new Date("2026-09-21T00:00:00.000Z"),
        endsAt: new Date("2026-09-22T00:00:00.000Z"),
      });
      expect(leftover).toEqual([]);
    } finally {
      await saveRoomSettings({
        actor: admin,
        cancellationNoticeHours: 48,
        bookingIntervalMinutes: 30,
        minimumBookingMinutes: 60,
        maximumBookingMinutes: null,
        maximumAdvanceBookingDays: null,
        reminderNoticeHours: 24,
        hours: defaultHours,
      });
    }
  });

  it("allows adjacent bookings and rejects every overlap", async () => {
    const admin = await createAdmin();
    const first = await createTherapist("adjacent-a");
    const second = await createTherapist("adjacent-b");
    const {id: roomId} = await seedRoom(admin, `Adjacent ${Date.now()}`);

    const morning = await reserveRoom({
      actor: first,
      roomId,
      date,
      start: "10:00",
      end: "11:00",
      now,
    });
    const afternoon = await reserveRoom({
      actor: second,
      roomId,
      date,
      start: "11:00",
      end: "12:00",
      now,
    });
    expect(morning.id).not.toBe(afternoon.id);

    await expect(
      reserveRoom({
        actor: first,
        roomId,
        date,
        start: "10:30",
        end: "11:30",
        now,
      }),
    ).rejects.toMatchObject({code: "slotConflict"});
  });

  it("offers every room still available for the chosen start time", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("room-choice");
    const other = await createTherapist("room-choice-other");
    const first = await seedRoom(admin, `Choice A ${Date.now()}`);
    const second = await seedRoom(admin, `Choice B ${Date.now()}`);

    const both = await previewReservationChoices({
      actor: therapist,
      roomIds: [first.id, second.id],
      date,
      start: "10:00",
      now,
    });
    expect(both.map((preview) => preview.room.id)).toEqual([first.id, second.id]);

    await reserveRoom({
      actor: other,
      roomId: second.id,
      date,
      start: "10:00",
      end: "11:00",
      now,
    });
    const remaining = await previewReservationChoices({
      actor: therapist,
      roomIds: [first.id, second.id],
      date,
      start: "10:00",
      now,
    });
    expect(remaining.map((preview) => preview.room.id)).toEqual([first.id]);
  });

  it("lets only one of two concurrent same-slot attempts succeed", async () => {
    const admin = await createAdmin();
    const first = await createTherapist("race-a");
    const second = await createTherapist("race-b");
    const {id: roomId} = await seedRoom(admin, `Race ${Date.now()}`);

    const results = await Promise.allSettled([
      reserveRoom({actor: first, roomId, date, start: "16:00", end: "17:00", now}),
      reserveRoom({actor: second, roomId, date, start: "16:00", end: "17:00", now}),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({
      status: "rejected",
      reason: expect.objectContaining({code: "slotConflict"}),
    });

    const leftover = await overlappingConfirmedBookings({
      roomId,
      startsAt: new Date("2026-09-21T14:00:00.000Z"),
      endsAt: new Date("2026-09-21T15:00:00.000Z"),
    });
    expect(leftover).toHaveLength(1);
  });

  it("ignores browser-supplied identity, rate and amount and hides others' details", async () => {
    const admin = await createAdmin();
    const owner = await createTherapist("privacy-owner");
    const other = await createTherapist("privacy-other");
    const courseOnly = await createTherapist("course", false);
    const {id: roomId} = await seedRoom(admin, `Privacy reserve ${Date.now()}`);

    const booking = await reserveRoom({
      actor: owner,
      roomId,
      date,
      start: "09:00",
      end: "10:00",
      now,
    });
    expect(booking.amountMinor).toBe(4000);
    expect(booking.userId).toBe(owner.id);

    await expect(
      reserveRoom({
        actor: courseOnly,
        roomId,
        date,
        start: "12:00",
        end: "13:00",
        now,
      }),
    ).rejects.toMatchObject({code: "forbidden"});

    await expect(
      reserveRoom({
        actor: admin,
        roomId,
        date,
        start: "12:00",
        end: "13:00",
        now,
      }),
    ).rejects.toMatchObject({code: "forbidden"});

    const otherGrid = await therapistAvailability({
      actor: other,
      view: "day",
      date,
      roomId,
      now,
    });
    const booked = otherGrid.slots.find((slot) => slot.localStart === "09:00");
    expect(booked?.state).toBe("booked");
    expect(booked).not.toHaveProperty("ownBookingId");
    expect(JSON.stringify(otherGrid)).not.toContain(owner.id);
    expect(JSON.stringify(otherGrid)).not.toContain(owner.email);

    await expect(getMyRoomBooking(other, booking.id)).rejects.toMatchObject({
      code: "notFound",
    });
    const own = await getMyRoomBooking(owner, booking.id);
    expect(own.amountMinor).toBe(4000);
    expect(own.roomName).toBeTruthy();
    expect(JSON.stringify(own)).not.toContain(other.email);
  });

  it("rejects invalid and ambiguous Zurich local selections", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("dst");
    const {id: roomId} = await seedRoom(admin, `DST reserve ${Date.now()}`);

    await expect(
      reserveRoom({
        actor: therapist,
        roomId,
        date: "2026-03-29",
        start: "02:30",
        end: "04:00",
        now: new Date("2026-03-20T08:00:00.000Z"),
      }),
    ).rejects.toMatchObject({code: "invalidTime"});

    await expect(
      reserveRoom({
        actor: therapist,
        roomId,
        date: "2026-10-25",
        start: "02:30",
        end: "04:00",
        now: new Date("2026-10-01T08:00:00.000Z"),
      }),
    ).rejects.toMatchObject({code: "ambiguousTime"});
  });
});

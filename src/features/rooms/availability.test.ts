import {afterAll, describe, expect, it} from "vitest";
import {inArray} from "drizzle-orm";

import {closeDb, getDb} from "@/db";
import {roomBookings, rooms} from "@/db/schema";
import {hashPassword} from "@/features/auth/password";
import {insertUser} from "@/features/auth/repository";
import {normalizeEmail} from "@/features/auth/email";
import {
  adminAvailability,
  assertPrivacySafePayload,
  therapistAvailability,
} from "@/features/rooms/availability";
import {createRoomBlock} from "@/features/rooms/blocks";
import {RoomError} from "@/features/rooms/errors";
import {createRoom, moveRoom, setRoomActive} from "@/features/rooms/inventory";
import {durationMinutesBetween, quoteRoomBooking} from "@/features/rooms/pricing";
import {findRoomById, insertConfirmedBooking} from "@/features/rooms/repository";
import {saveRoomSettings} from "@/features/rooms/settings";
import {zurichLocalToUtc} from "@/features/rooms/timezone";
import {getDatabaseUrl} from "@/lib/database-url";

const hasDatabase = Boolean(getDatabaseUrl());
const frozenMorning = new Date("2026-09-10T04:00:00.000Z");

async function bookFixture(input: {
  room: {id: string};
  userId: string;
  startsAt: Date;
  endsAt: Date;
}) {
  const room = await findRoomById(input.room.id);
  if (!room) {
    throw new Error("roomMissing");
  }
  const quote = quoteRoomBooking({
    hourlyRateMinor: room.hourlyRateMinor,
    durationMinutes: durationMinutesBetween(input.startsAt, input.endsAt),
  });
  return insertConfirmedBooking({
    roomId: room.id,
    userId: input.userId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    roomName: room.name,
    ...quote,
  });
}

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
}

describe.skipIf(!hasDatabase)("rooms inventory and availability", () => {
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
    const email = uniqueEmail("room-admin");
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
    const email = uniqueEmail(label);
    return insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Theo",
      lastName: label,
      locale: "en",
      roomBookingEnabled: true,
      passwordHash: await hashPassword("user-password-12"),
      emailVerifiedAt: new Date(),
    });
  }

  async function createCourseUser() {
    const email = uniqueEmail("course-only");
    return insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Course",
      lastName: "Only",
      locale: "en",
      passwordHash: await hashPassword("user-password-12"),
      emailVerifiedAt: new Date(),
    });
  }

  async function seedRoom(
    admin: Awaited<ReturnType<typeof createAdmin>>,
    name: string,
    hourlyRateMinor = 4000,
  ) {
    const created = await createRoom({
      actor: admin,
      name,
      description: "",
      hourlyRateMinor,
    });
    createdRoomIds.push(created.id);
    return created;
  }

  it("lets an admin create, price, disable, re-enable and reorder a room", async () => {
    const admin = await createAdmin();
    const first = await seedRoom(admin, `Cabinet ${Date.now()}`, 4000);
    const second = await seedRoom(admin, `Cabinet later ${Date.now()}`, 4500);

    await setRoomActive({actor: admin, roomId: first.id, active: false});
    const disabled = await findRoomById(first.id);
    expect(disabled?.active).toBe(false);
    await setRoomActive({actor: admin, roomId: first.id, active: true});
    const enabled = await findRoomById(first.id);
    expect(enabled?.active).toBe(true);
    expect(enabled?.hourlyRateMinor).toBe(4000);

    const before = await findRoomById(second.id);
    await moveRoom({actor: admin, roomId: second.id, direction: "up"});
    const afterFirst = await findRoomById(first.id);
    const afterSecond = await findRoomById(second.id);
    expect(afterSecond?.displayOrder).toBe(enabled?.displayOrder);
    expect(afterFirst?.displayOrder).toBe(before?.displayOrder);
  });

  it("denies room data to a course-only user and hides other identities", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("owner");
    const other = await createTherapist("other");
    const courseUser = await createCourseUser();
    const room = await seedRoom(admin, `Privacy ${Date.now()}`, 3500);
    const roomId = room.id;

    const start = zurichLocalToUtc("2026-09-10", "10:00");
    const end = zurichLocalToUtc("2026-09-10", "11:00");
    expect(start.ok && end.ok).toBe(true);
    if (start.ok && end.ok) {
      await bookFixture({
        room,
        userId: other.id,
        startsAt: start.instant,
        endsAt: end.instant,
      });
    }

    await expect(
      therapistAvailability({
        actor: courseUser,
        view: "day",
        date: "2026-09-10",
        roomId,
        now: frozenMorning,
      }),
    ).rejects.toMatchObject({code: "forbidden"});

    const grid = await therapistAvailability({
      actor: therapist,
      view: "day",
      date: "2026-09-10",
      roomId,
      now: frozenMorning,
    });
    assertPrivacySafePayload(grid);
    expect(JSON.stringify(grid)).not.toContain(other.email);
    expect(JSON.stringify(grid)).not.toContain(other.id);
    const booked = grid.slots.find(
      (slot) => slot.localStart === "10:00" && slot.state === "booked",
    );
    expect(booked).toBeDefined();
    expect(booked).not.toHaveProperty("userId");
    expect(Object.keys(booked ?? {})).not.toContain("email");

    const mineStart = zurichLocalToUtc("2026-09-10", "14:00");
    const mineEnd = zurichLocalToUtc("2026-09-10", "15:00");
    if (mineStart.ok && mineEnd.ok) {
      const mine = await bookFixture({
        room,
        userId: therapist.id,
        startsAt: mineStart.instant,
        endsAt: mineEnd.instant,
      });
      const mineGrid = await therapistAvailability({
        actor: therapist,
        view: "day",
        date: "2026-09-10",
        roomId,
        now: frozenMorning,
      });
      const mineSlot = mineGrid.slots.find((slot) => slot.localStart === "14:00");
      expect(mineSlot?.state).toBe("my-booking");
      expect(mineSlot?.ownBookingId).toBe(mine.id);
      assertPrivacySafePayload(mineGrid);
    }

    const adminGrid = await adminAvailability({
      actor: admin,
      view: "day",
      date: "2026-09-10",
      roomId,
      now: frozenMorning,
    });
    assertPrivacySafePayload(adminGrid);
    expect(JSON.stringify(adminGrid)).not.toContain(other.email);
    expect(adminGrid.slots.some((slot) => slot.state === "booked")).toBe(true);
  });

  it("marks closed time, disabled rooms and blocks unavailable at exact boundaries", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("hours");
    const {id: roomId} = await seedRoom(admin, `Hours ${Date.now()}`);

    await saveRoomSettings({
      actor: admin,
      cancellationNoticeHours: 48,
      bookingIntervalMinutes: 30,
      minimumBookingMinutes: 60,
      maximumBookingMinutes: null,
      maximumAdvanceBookingDays: null,
      reminderNoticeHours: 24,
      hours: [
        {weekday: 1, closed: false, startMinute: 7 * 60, endMinute: 21 * 60},
        {weekday: 2, closed: false, startMinute: 7 * 60, endMinute: 21 * 60},
        {weekday: 3, closed: false, startMinute: 7 * 60, endMinute: 21 * 60},
        {weekday: 4, closed: false, startMinute: 7 * 60, endMinute: 21 * 60},
        {weekday: 5, closed: false, startMinute: 7 * 60, endMinute: 21 * 60},
        {weekday: 6, closed: false, startMinute: 8 * 60, endMinute: 18 * 60},
        {weekday: 7, closed: true, startMinute: 0, endMinute: 0},
      ],
    });

    const sunday = await therapistAvailability({
      actor: therapist,
      view: "day",
      date: "2026-09-13",
      roomId,
      now: frozenMorning,
    });
    expect(sunday.slots.every((slot) => slot.state === "unavailable")).toBe(true);

    const thursday = await therapistAvailability({
      actor: therapist,
      view: "day",
      date: "2026-09-10",
      roomId,
      now: frozenMorning,
    });
    expect(thursday.slots.find((slot) => slot.localStart === "06:30")).toBeUndefined();
    expect(thursday.slots.find((slot) => slot.localStart === "07:00")?.state).toBe(
      "available",
    );
    expect(thursday.slots.find((slot) => slot.localStart === "20:30")?.state).toBe(
      "available",
    );

    await createRoomBlock({
      actor: admin,
      roomId,
      startLocal: "2026-09-10T12:00",
      endLocal: "2026-09-10T13:00",
      reason: "Maintenance",
    });
    const blocked = await therapistAvailability({
      actor: therapist,
      view: "day",
      date: "2026-09-10",
      roomId,
      now: frozenMorning,
    });
    expect(blocked.slots.find((slot) => slot.localStart === "12:00")?.state).toBe(
      "unavailable",
    );
    expect(blocked.slots.find((slot) => slot.localStart === "11:30")?.state).toBe(
      "available",
    );
    expect(blocked.slots.find((slot) => slot.localStart === "13:00")?.state).toBe(
      "available",
    );

    await setRoomActive({actor: admin, roomId, active: false});
    const disabledGrid = await therapistAvailability({
      actor: therapist,
      view: "day",
      date: "2026-09-10",
      roomId,
      now: frozenMorning,
    });
    expect(disabledGrid.rooms).toHaveLength(1);
    expect(disabledGrid.slots.every((slot) => slot.state === "unavailable")).toBe(true);
  });

  it("rejects a block over a confirmed reservation without invalidating it", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("conflict");
    const room = await seedRoom(admin, `Conflict ${Date.now()}`);
    const roomId = room.id;
    const start = zurichLocalToUtc("2026-09-11", "09:00");
    const end = zurichLocalToUtc("2026-09-11", "10:30");
    expect(start.ok && end.ok).toBe(true);
    if (!start.ok || !end.ok) {
      return;
    }
    const booking = await bookFixture({
      room,
      userId: therapist.id,
      startsAt: start.instant,
      endsAt: end.instant,
    });

    await expect(
      createRoomBlock({
        actor: admin,
        roomId,
        startLocal: "2026-09-11T09:30",
        endLocal: "2026-09-11T10:00",
        reason: "Holiday",
      }),
    ).rejects.toBeInstanceOf(RoomError);

    try {
      await createRoomBlock({
        actor: admin,
        roomId,
        startLocal: "2026-09-11T09:30",
        endLocal: "2026-09-11T10:00",
        reason: "Holiday",
      });
    } catch (error) {
      expect(error).toMatchObject({code: "blockConflict"});
      if (error instanceof RoomError) {
        expect(error.conflicts[0]?.bookingId).toBe(booking.id);
        expect(JSON.stringify(error.conflicts)).not.toContain(therapist.email);
      }
    }

    const grid = await therapistAvailability({
      actor: therapist,
      view: "day",
      date: "2026-09-11",
      roomId,
    });
    expect(grid.slots.find((slot) => slot.localStart === "09:00")?.state).toBe(
      "my-booking",
    );
  });

  it("builds week slots for one room while still listing the inventory", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("week-scope");
    const first = await seedRoom(admin, `Week first ${Date.now()}`);
    const second = await seedRoom(admin, `Week second ${Date.now()}`);

    const week = await therapistAvailability({
      actor: therapist,
      view: "week",
      date: "2026-09-14",
    });

    expect(week.rooms.map((room) => room.id)).toEqual(
      expect.arrayContaining([first.id, second.id]),
    );
    const slotted = new Set(week.slots.map((slot) => slot.roomId));
    expect(slotted.size).toBe(1);
    expect(week.rooms.some((room) => slotted.has(room.id))).toBe(true);
  });

  it("rejects a second block that overlaps an existing one", async () => {
    const admin = await createAdmin();
    const {id: roomId} = await seedRoom(admin, `Overlap block ${Date.now()}`);

    await createRoomBlock({
      actor: admin,
      roomId,
      startLocal: "2026-09-14T10:00",
      endLocal: "2026-09-14T12:00",
      reason: "Paint",
    });

    await expect(
      createRoomBlock({
        actor: admin,
        roomId,
        startLocal: "2026-09-14T11:00",
        endLocal: "2026-09-14T13:00",
        reason: "Also paint",
      }),
    ).rejects.toMatchObject({code: "blockOverlap"});
  });

  it("rejects invalid and ambiguous Zurich local selections", async () => {
    const admin = await createAdmin();
    const {id: roomId} = await seedRoom(admin, `DST ${Date.now()}`);

    await expect(
      createRoomBlock({
        actor: admin,
        roomId,
        startLocal: "2026-03-29T02:30",
        endLocal: "2026-03-29T04:00",
        reason: "Gap",
      }),
    ).rejects.toMatchObject({code: "invalidTime"});

    await expect(
      createRoomBlock({
        actor: admin,
        roomId,
        startLocal: "2026-10-25T02:30",
        endLocal: "2026-10-25T04:00",
        reason: "Overlap",
      }),
    ).rejects.toMatchObject({code: "ambiguousTime"});
  });
});

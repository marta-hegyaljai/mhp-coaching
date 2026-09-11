import {afterAll, describe, expect, it} from "vitest";
import {eq} from "drizzle-orm";

import {closeDb, getDb} from "@/db";
import {roomBookingPrivateNotes, roomBookings, rooms} from "@/db/schema";
import {normalizeEmail} from "@/features/auth/email";
import {hashPassword} from "@/features/auth/password";
import {insertUser} from "@/features/auth/repository";
import {RoomError} from "@/features/rooms/errors";
import {createRoom} from "@/features/rooms/inventory";
import {
  deleteOwnPrivateNote,
  getOwnPrivateNote,
  saveOwnPrivateNote,
} from "@/features/rooms/private-notes";
import {PRIVATE_NOTE_MAX_LENGTH} from "@/features/rooms/limits";
import {moveRoomBooking} from "@/features/rooms/lifecycle";
import {reserveRoom} from "@/features/rooms/reservations";
import {getDatabaseUrl} from "@/lib/database-url";

const hasDatabase = Boolean(getDatabaseUrl());
const TEST_KEY = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
process.env.ROOM_NOTE_ENCRYPTION_KEY ??= TEST_KEY;

const now = new Date("2026-09-14T06:00:00.000Z");
const date = "2026-09-21";

describe.skipIf(!hasDatabase)("private room notes", () => {
  const createdRoomIds: string[] = [];

  afterAll(async () => {
    if (createdRoomIds.length > 0) {
      const db = getDb();
      await db.delete(roomBookings).where(eq(roomBookings.roomId, createdRoomIds[0]));
      for (const roomId of createdRoomIds) {
        await db.delete(roomBookings).where(eq(roomBookings.roomId, roomId));
        await db.delete(rooms).where(eq(rooms.id, roomId));
      }
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

  async function seedBooking() {
    const admin = await createAdmin();
    const owner = await createTherapist("owner");
    const stranger = await createTherapist("stranger");
    const courseOnly = await createTherapist("course", false);
    const created = await createRoom({
      actor: admin,
      name: `Note ${Date.now()}`,
      description: "",
      hourlyRateMinor: 4000,
    });
    createdRoomIds.push(created.id);
    const booking = await reserveRoom({
      actor: owner,
      roomId: created.id,
      date,
      start: "10:00",
      end: "11:00",
      now,
    });
    return {admin, owner, stranger, courseOnly, booking};
  }

  it("lets only the owner create, edit and delete a note stored as ciphertext", async () => {
    const {admin, owner, stranger, courseOnly, booking} = await seedBooking();
    const secret = `owner-secret-${booking.id}`;

    expect(await getOwnPrivateNote(owner, booking.id)).toBeNull();

    const saved = await saveOwnPrivateNote(owner, booking.id, `  ${secret}  `);
    expect(saved?.text).toBe(secret);

    const [row] = await getDb()
      .select()
      .from(roomBookingPrivateNotes)
      .where(eq(roomBookingPrivateNotes.bookingId, booking.id));
    expect(row).toBeTruthy();
    expect(row.ownerUserId).toBe(owner.id);
    expect(row.ciphertext.includes(secret)).toBe(false);
    expect(JSON.stringify(booking)).not.toContain(secret);
    expect(JSON.stringify(booking)).not.toContain("ciphertext");

    const read = await getOwnPrivateNote(owner, booking.id);
    expect(read?.text).toBe(secret);

    await expect(getOwnPrivateNote(admin, booking.id)).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(getOwnPrivateNote(stranger, booking.id)).rejects.toMatchObject({
      code: "notFound",
    });
    await expect(getOwnPrivateNote(courseOnly, booking.id)).rejects.toBeInstanceOf(RoomError);
    await expect(saveOwnPrivateNote(admin, booking.id, "admin probe")).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(saveOwnPrivateNote(stranger, booking.id, "stranger probe")).rejects.toMatchObject({
      code: "notFound",
    });

    await saveOwnPrivateNote(owner, booking.id, `${secret}-edited`);
    expect((await getOwnPrivateNote(owner, booking.id))?.text).toBe(`${secret}-edited`);

    await deleteOwnPrivateNote(owner, booking.id);
    expect(await getOwnPrivateNote(owner, booking.id)).toBeNull();
  });

  it("rejects oversized or control-character notes and treats blank as delete", async () => {
    const {owner, booking} = await seedBooking();
    await saveOwnPrivateNote(owner, booking.id, "keep-me");

    await expect(
      saveOwnPrivateNote(owner, booking.id, "x".repeat(PRIVATE_NOTE_MAX_LENGTH + 1)),
    ).rejects.toMatchObject({code: "invalidNote"});
    await expect(saveOwnPrivateNote(owner, booking.id, "bad\u0000note")).rejects.toMatchObject({
      code: "invalidNote",
    });
    expect((await getOwnPrivateNote(owner, booking.id))?.text).toBe("keep-me");

    expect(await saveOwnPrivateNote(owner, booking.id, "   ")).toBeNull();
    expect(await getOwnPrivateNote(owner, booking.id)).toBeNull();
  });

  it("attaches an optional note at reservation time", async () => {
    const admin = await createAdmin();
    const owner = await createTherapist("with-note");
    const created = await createRoom({
      actor: admin,
      name: `Reserve note ${Date.now()}`,
      description: "",
      hourlyRateMinor: 4000,
    });
    createdRoomIds.push(created.id);
    const secret = `reserve-${created.id}`;
    const booking = await reserveRoom({
      actor: owner,
      roomId: created.id,
      date,
      start: "14:00",
      end: "15:00",
      now,
      note: secret,
    });
    expect(JSON.stringify(booking)).not.toContain(secret);
    expect((await getOwnPrivateNote(owner, booking.id))?.text).toBe(secret);
  });

  it("fails closed when reserving with a note and the encryption key is missing", async () => {
    const admin = await createAdmin();
    const owner = await createTherapist("missing-key");
    const created = await createRoom({
      actor: admin,
      name: `Missing key ${Date.now()}`,
      description: "",
      hourlyRateMinor: 4000,
    });
    createdRoomIds.push(created.id);
    const previous = process.env.ROOM_NOTE_ENCRYPTION_KEY;
    delete process.env.ROOM_NOTE_ENCRYPTION_KEY;
    try {
      await expect(
        reserveRoom({
          actor: owner,
          roomId: created.id,
          date,
          start: "16:00",
          end: "17:00",
          now,
          note: "should-not-persist",
        }),
      ).rejects.toMatchObject({code: "noteKeyMissing"});
      expect(
        await getDb()
          .select()
          .from(roomBookings)
          .where(eq(roomBookings.roomId, created.id)),
      ).toEqual([]);
    } finally {
      if (previous === undefined) {
        delete process.env.ROOM_NOTE_ENCRYPTION_KEY;
      } else {
        process.env.ROOM_NOTE_ENCRYPTION_KEY = previous;
      }
    }
  });

  it("moves the owner note onto the successor booking after a late change", async () => {
    const admin = await createAdmin();
    const owner = await createTherapist("late-note");
    const created = await createRoom({
      actor: admin,
      name: `Late note ${Date.now()}`,
      description: "",
      hourlyRateMinor: 4000,
    });
    createdRoomIds.push(created.id);
    const secret = `late-note-${created.id}`;
    const nearNow = new Date("2026-09-14T06:00:00.000Z");
    const nearDate = "2026-09-15";
    const booking = await reserveRoom({
      actor: owner,
      roomId: created.id,
      date: nearDate,
      start: "10:00",
      end: "11:00",
      now: nearNow,
      note: secret,
    });

    const moved = await moveRoomBooking({
      actor: owner,
      bookingId: booking.id,
      roomId: created.id,
      date: nearDate,
      start: "14:00",
      end: "15:00",
      now: nearNow,
    });
    expect(moved.kind).toBe("replaced");
    if (moved.kind !== "replaced") {
      return;
    }

    expect(await getOwnPrivateNote(owner, booking.id)).toBeNull();
    expect((await getOwnPrivateNote(owner, moved.booking.id))?.text).toBe(secret);
    expect(JSON.stringify(moved.booking)).not.toContain(secret);
  });
});

import {afterAll, describe, expect, it} from "vitest";
import {and, eq, inArray} from "drizzle-orm";

import {closeDb, getDb} from "@/db";
import {roomAvailabilityRequests, roomBookings, rooms} from "@/db/schema";
import {normalizeEmail} from "@/features/auth/email";
import {hashPassword} from "@/features/auth/password";
import {insertUser} from "@/features/auth/repository";
import {
  createAvailabilityRequest,
  getAdminAvailabilityRequest,
  getMyAvailabilityRequest,
  listAdminAvailabilityRequests,
  listMyAvailabilityRequests,
  resolveAvailabilityRequest,
  withdrawAvailabilityRequest,
} from "@/features/rooms/availability-requests";
import {createRoom, setRoomActive} from "@/features/rooms/inventory";
import {assertNoPrivateNoteMaterial} from "@/features/rooms/privacy";
import {reserveRoom} from "@/features/rooms/reservations";
import {overlappingConfirmedBookings} from "@/features/rooms/repository";
import {getDatabaseUrl} from "@/lib/database-url";

const hasDatabase = Boolean(getDatabaseUrl());
const now = new Date("2026-09-14T06:00:00.000Z");
const date = "2026-09-21";

describe.skipIf(!hasDatabase)("availability requests", () => {
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

  it("accepts a request only when the interval is unreservable and never occupies the slot", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("requester");
    const other = await createTherapist("other");
    const courseOnly = await createTherapist("course", false);
    const room = await seedRoom(admin, `Request ${Date.now()}`);

    await expect(
      createAvailabilityRequest({
        actor: therapist,
        date,
        start: "10:00",
        end: "11:00",
        preferredRoomId: room.id,
        now,
      }),
    ).rejects.toMatchObject({code: "slotAvailable"});

    await reserveRoom({
      actor: other,
      roomId: room.id,
      date,
      start: "10:00",
      end: "11:00",
      now,
    });

    const request = await createAvailabilityRequest({
      actor: therapist,
      date,
      start: "10:00",
      end: "11:00",
      preferredRoomId: room.id,
      message: "Need the room for a client visit",
      now,
    });
    expect(request.status).toBe("OPEN");
    expect(request.message).toBe("Need the room for a client visit");
    expect(request).not.toHaveProperty("adminNote");
    assertNoPrivateNoteMaterial(request, "", ["adminNote", "admin_note"]);

    const occupancy = await overlappingConfirmedBookings({
      roomId: room.id,
      startsAt: new Date(request.startsAt),
      endsAt: new Date(request.endsAt),
    });
    expect(occupancy).toHaveLength(1);
    expect(occupancy[0]?.userId).toBe(other.id);

    const second = await createAvailabilityRequest({
      actor: therapist,
      date,
      start: "10:00",
      end: "11:00",
      preferredRoomId: room.id,
      now,
    });
    expect(second.id).toBe(request.id);

    await expect(
      createAvailabilityRequest({
        actor: courseOnly,
        date,
        start: "10:00",
        end: "11:00",
        now,
      }),
    ).rejects.toMatchObject({code: "forbidden"});

    await expect(getMyAvailabilityRequest(other, request.id)).rejects.toMatchObject({
      code: "notFound",
    });
    expect((await listMyAvailabilityRequests(other)).map((item) => item.id)).not.toContain(
      request.id,
    );
  });

  it("rejects past, misaligned, control-character and currently bookable any-room intervals", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("rules");
    const room = await seedRoom(admin, `Rules ${Date.now()}`);

    await expect(
      createAvailabilityRequest({
        actor: therapist,
        date: "2026-09-13",
        start: "10:00",
        end: "11:00",
        preferredRoomId: room.id,
        now,
      }),
    ).rejects.toMatchObject({code: "tooSoon"});

    await expect(
      createAvailabilityRequest({
        actor: therapist,
        date,
        start: "10:10",
        end: "11:10",
        preferredRoomId: room.id,
        now,
      }),
    ).rejects.toMatchObject({code: "invalidIncrement"});

    await expect(
      createAvailabilityRequest({
        actor: therapist,
        date,
        start: "10:00",
        end: "11:00",
        message: "bad\u0000message",
        now,
      }),
    ).rejects.toMatchObject({code: "invalidMessage"});

    await expect(
      createAvailabilityRequest({
        actor: therapist,
        date,
        start: "16:00",
        end: "17:00",
        now,
      }),
    ).rejects.toMatchObject({code: "slotAvailable"});
  });

  it("allows a request for a disabled preferred room and lets admin resolve without exposing the admin note to the therapist", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("disabled-room");
    const room = await seedRoom(admin, `Disabled ${Date.now()}`);
    await setRoomActive({actor: admin, roomId: room.id, active: false});

    const request = await createAvailabilityRequest({
      actor: therapist,
      date,
      start: "10:00",
      end: "11:30",
      preferredRoomId: room.id,
      message: "Please reopen this room",
      now,
    });

    const adminView = await getAdminAvailabilityRequest(admin, request.id);
    expect(adminView.owner.email).toBe(therapist.email);
    expect(adminView.message).toBe("Please reopen this room");

    const resolved = await resolveAvailabilityRequest({
      actor: admin,
      requestId: request.id,
      decision: "DECLINED",
      adminNote: "Internal: keep closed this month",
      now,
    });
    expect(resolved.status).toBe("DECLINED");
    expect(resolved.adminNote).toBe("Internal: keep closed this month");

    const therapistView = await getMyAvailabilityRequest(therapist, request.id);
    expect(therapistView.status).toBe("DECLINED");
    expect(therapistView.message).toBe("Please reopen this room");
    expect(therapistView).not.toHaveProperty("adminNote");
    assertNoPrivateNoteMaterial(therapistView, "Internal: keep closed this month", [
      "adminNote",
      "admin_note",
    ]);

    await expect(
      resolveAvailabilityRequest({
        actor: admin,
        requestId: request.id,
        decision: "RESOLVED",
        now,
      }),
    ).rejects.toMatchObject({code: "alreadyResolved"});

    await expect(withdrawAvailabilityRequest(therapist, request.id)).rejects.toMatchObject({
      code: "notOpen",
    });

    const inbox = await listAdminAvailabilityRequests(admin, {
      q: therapist.email,
      status: "DECLINED",
      page: 1,
    });
    expect(inbox.rows.some((row) => row.id === request.id)).toBe(true);

    await expect(
      listAdminAvailabilityRequests(therapist, {q: "", status: "all", page: 1}),
    ).rejects.toMatchObject({code: "forbidden"});
  });

  it("lets the owner withdraw an open request without touching inventory", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("withdraw");
    const other = await createTherapist("holder");
    const room = await seedRoom(admin, `Withdraw ${Date.now()}`);
    await reserveRoom({
      actor: other,
      roomId: room.id,
      date,
      start: "12:00",
      end: "13:00",
      now,
    });
    const request = await createAvailabilityRequest({
      actor: therapist,
      date,
      start: "12:00",
      end: "13:00",
      preferredRoomId: room.id,
      now,
    });
    await withdrawAvailabilityRequest(therapist, request.id);
    await expect(getMyAvailabilityRequest(therapist, request.id)).rejects.toMatchObject({
      code: "notFound",
    });
    expect(
      await getDb()
        .select()
        .from(roomAvailabilityRequests)
        .where(eq(roomAvailabilityRequests.id, request.id)),
    ).toEqual([]);
    expect(
      (
        await overlappingConfirmedBookings({
          roomId: room.id,
          startsAt: new Date("2026-09-21T10:00:00.000Z"),
          endsAt: new Date("2026-09-21T11:00:00.000Z"),
        })
      ).length,
    ).toBeGreaterThan(0);
  });

  it("rejects an any-room request while another active room is still bookable", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("any-room");
    const occupied = await seedRoom(admin, `Occupied ${Date.now()}`);
    await seedRoom(admin, `Free ${Date.now()}`);
    await reserveRoom({
      actor: await createTherapist("any-holder"),
      roomId: occupied.id,
      date,
      start: "10:00",
      end: "11:00",
      now,
    });

    await expect(
      createAvailabilityRequest({
        actor: therapist,
        date,
        start: "10:00",
        end: "11:00",
        now,
      }),
    ).rejects.toMatchObject({code: "slotAvailable"});
  });

  it("lets an admin mark a request resolved and shows that status to the therapist", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("resolved");
    const holder = await createTherapist("resolved-holder");
    const room = await seedRoom(admin, `Resolved ${Date.now()}`);
    await reserveRoom({
      actor: holder,
      roomId: room.id,
      date,
      start: "09:00",
      end: "10:00",
      now,
    });
    const request = await createAvailabilityRequest({
      actor: therapist,
      date,
      start: "09:00",
      end: "10:00",
      preferredRoomId: room.id,
      now,
    });

    const resolved = await resolveAvailabilityRequest({
      actor: admin,
      requestId: request.id,
      decision: "RESOLVED",
      adminNote: "Opened an extra hour",
      now,
    });
    expect(resolved.status).toBe("RESOLVED");
    expect(resolved.adminNote).toBe("Opened an extra hour");

    const mine = await listMyAvailabilityRequests(therapist);
    expect(mine[0]?.id).toBe(request.id);
    expect(mine[0]?.status).toBe("RESOLVED");
    expect(mine[0]).not.toHaveProperty("adminNote");
  });

  it("collapses concurrent duplicate open requests for the same slot to one row", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("race");
    const holder = await createTherapist("race-holder");
    const room = await seedRoom(admin, `Race request ${Date.now()}`);
    await reserveRoom({
      actor: holder,
      roomId: room.id,
      date,
      start: "15:00",
      end: "16:00",
      now,
    });

    const results = await Promise.all([
      createAvailabilityRequest({
        actor: therapist,
        date,
        start: "15:00",
        end: "16:00",
        preferredRoomId: room.id,
        now,
      }),
      createAvailabilityRequest({
        actor: therapist,
        date,
        start: "15:00",
        end: "16:00",
        preferredRoomId: room.id,
        now,
      }),
    ]);

    expect(new Set(results.map((request) => request.id)).size).toBe(1);
    const openRows = await getDb()
      .select()
      .from(roomAvailabilityRequests)
      .where(
        and(
          eq(roomAvailabilityRequests.userId, therapist.id),
          eq(roomAvailabilityRequests.status, "OPEN"),
          eq(roomAvailabilityRequests.preferredRoomId, room.id),
        ),
      );
    expect(openRows).toHaveLength(1);
  });
});

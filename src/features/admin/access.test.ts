import {afterAll, describe, expect, it, vi} from "vitest";

import {and, eq, inArray, isNull, ne} from "drizzle-orm";

import {closeDb, getDb} from "@/db";
import {users} from "@/db/schema";
import {getDatabaseUrl} from "@/lib/database-url";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {
  inviteUser,
  setUserAdmin,
  setUserDisabled,
  setUserRoomBooking,
} from "@/features/admin/access";
import {hashPassword} from "@/features/auth/password";
import {canAccessRooms, canAuthenticate} from "@/features/auth/policy";
import {
  findActiveSessionByTokenHash,
  findUserByNormalizedEmail,
  insertSession,
  insertUser,
  listAuditForUser,
} from "@/features/auth/repository";
import {normalizeEmail} from "@/features/auth/email";
import {hashToken} from "@/features/auth/tokens";

vi.mock("@/features/email/invitation", () => ({
  sendAccountInvitation: vi.fn().mockResolvedValue(undefined),
}));

const hasDatabase = Boolean(getDatabaseUrl());

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
}

describe.skipIf(!hasDatabase)("admin access control", () => {
  afterAll(async () => {
    await closeDb();
  });

  async function createAdmin() {
    const email = uniqueEmail("admin");
    return insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Ada",
      lastName: "Admin",
      locale: "en",
      isAdmin: true,
      passwordHash: await hashPassword("admin-password-12"),
      emailVerifiedAt: new Date(),
    });
  }

  it("lets an admin invite a user and records before/after audit", async () => {
    const actor = await createAdmin();
    const email = uniqueEmail("invitee");
    const {user, resent} = await inviteUser({
      actor,
      email,
      firstName: "Theo",
      lastName: "Therapist",
      locale: "en",
      isAdmin: false,
      roomBookingEnabled: true,
    });

    expect(resent).toBe(false);
    expect(user.passwordHash).toBeNull();
    expect(user.roomBookingEnabled).toBe(true);
    expect(canAuthenticate(user)).toBe(false);

    const events = await listAuditForUser(user.id);
    const invited = events.find((event) => event.action === AUDIT_ACTIONS.USER_INVITED);
    expect(invited?.actorUserId).toBe(actor.id);
    expect(invited?.targetUserId).toBe(user.id);
    expect(invited?.after).toMatchObject({
      isAdmin: false,
      roomBookingEnabled: true,
      pendingInvite: true,
    });
  });

  it("revokes sessions immediately when a user is disabled", async () => {
    const actor = await createAdmin();
    const email = uniqueEmail("disable");
    const target = await insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Dis",
      lastName: "Able",
      locale: "en",
      passwordHash: await hashPassword("user-password-12"),
      emailVerifiedAt: new Date(),
    });
    const tokenHash = hashToken(`session-${target.id}`);
    await insertSession({
      userId: target.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await setUserDisabled({actor, targetUserId: target.id, disabled: true});

    expect(await findActiveSessionByTokenHash(tokenHash)).toBeUndefined();
    const disabled = await findUserByNormalizedEmail(normalizeEmail(email));
    expect(disabled?.disabledAt).not.toBeNull();
    expect(canAuthenticate(disabled!)).toBe(false);

    const events = await listAuditForUser(target.id);
    expect(events[0]?.action).toBe(AUDIT_ACTIONS.USER_DISABLED);
    expect(events[0]?.before).toMatchObject({disabled: false});
    expect(events[0]?.after).toMatchObject({disabled: true});
  });

  it("grants and revokes room booking with immediate policy denial", async () => {
    const actor = await createAdmin();
    const email = uniqueEmail("rooms");
    const target = await insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Room",
      lastName: "User",
      locale: "en",
      passwordHash: await hashPassword("user-password-12"),
      emailVerifiedAt: new Date(),
    });

    const enabled = await setUserRoomBooking({
      actor,
      targetUserId: target.id,
      enabled: true,
    });
    expect(canAccessRooms(enabled)).toBe(true);

    const revoked = await setUserRoomBooking({
      actor,
      targetUserId: target.id,
      enabled: false,
    });
    expect(canAccessRooms(revoked)).toBe(false);

    const events = await listAuditForUser(target.id);
    expect(events.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        AUDIT_ACTIONS.ROOM_BOOKING_GRANTED,
        AUDIT_ACTIONS.ROOM_BOOKING_REVOKED,
      ]),
    );
  });

  it("cannot disable the last enabled admin or the current actor", async () => {
    const actor = await createAdmin();
    await expect(
      setUserDisabled({actor, targetUserId: actor.id, disabled: true}),
    ).rejects.toMatchObject({code: "cannotDisableSelf"});

    const otherEnabledAdmins = await getDb()
      .select({id: users.id})
      .from(users)
      .where(
        and(eq(users.isAdmin, true), isNull(users.disabledAt), ne(users.id, actor.id)),
      );
    const otherIds = otherEnabledAdmins.map((row) => row.id);

    if (otherIds.length > 0) {
      await getDb()
        .update(users)
        .set({disabledAt: new Date()})
        .where(inArray(users.id, otherIds));
    }

    try {
      let lastError: unknown;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        // Parallel room tests may mint another admin after the first snapshot.
        const raced = await getDb()
          .update(users)
          .set({disabledAt: new Date()})
          .where(and(eq(users.isAdmin, true), isNull(users.disabledAt), ne(users.id, actor.id)))
          .returning({id: users.id});
        otherIds.push(...raced.map((row) => row.id));
        try {
          await setUserAdmin({actor, targetUserId: actor.id, isAdmin: false});
          lastError = undefined;
        } catch (error) {
          lastError = error;
          break;
        }
      }
      expect(lastError).toMatchObject({code: "cannotDemoteLastAdmin"});
    } finally {
      if (otherIds.length > 0) {
        await getDb()
          .update(users)
          .set({disabledAt: null})
          .where(inArray(users.id, otherIds));
      }
    }
  });

  it("rejects inviting an email that already has a password", async () => {
    const actor = await createAdmin();
    const email = uniqueEmail("existing");
    await insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Ex",
      lastName: "Isting",
      locale: "en",
      passwordHash: await hashPassword("user-password-12"),
      emailVerifiedAt: new Date(),
    });

    await expect(
      inviteUser({
        actor,
        email,
        firstName: "Ex",
        lastName: "Isting",
        locale: "en",
        isAdmin: false,
        roomBookingEnabled: false,
      }),
    ).rejects.toMatchObject({code: "alreadyRegistered"});
  });

  it("rejects inviting a registered email with different casing", async () => {
    const actor = await createAdmin();
    const email = uniqueEmail("Case.User");
    await insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Case",
      lastName: "User",
      locale: "en",
      passwordHash: await hashPassword("user-password-12"),
      emailVerifiedAt: new Date(),
    });

    await expect(
      inviteUser({
        actor,
        email: email.toUpperCase(),
        firstName: "Case",
        lastName: "User",
        locale: "en",
        isAdmin: false,
        roomBookingEnabled: false,
      }),
    ).rejects.toMatchObject({code: "alreadyRegistered"});
  });
});

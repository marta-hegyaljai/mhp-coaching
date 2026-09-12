import {afterAll, describe, expect, it} from "vitest";

import {closeDb} from "@/db";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {normalizeEmail} from "@/features/auth/email";
import {hashPassword} from "@/features/auth/password";
import {insertUser, listAuditForUser} from "@/features/auth/repository";
import {setUserRoomDiscount} from "@/features/rooms/discounts";
import {RoomError} from "@/features/rooms/errors";
import {getDatabaseUrl} from "@/lib/database-url";

const hasDatabase = Boolean(getDatabaseUrl());

describe.skipIf(!hasDatabase)("room discounts", () => {
  afterAll(async () => {
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

  it("lets an admin set a percentage and records before/after audit", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("discount");
    expect(therapist.roomDiscountPercent).toBe(0);

    const updated = await setUserRoomDiscount({
      actor: admin,
      targetUserId: therapist.id,
      discountPercent: 15,
    });
    expect(updated.roomDiscountPercent).toBe(15);

    const events = await listAuditForUser(therapist.id);
    const changed = events.find((event) => event.action === AUDIT_ACTIONS.ROOM_DISCOUNT_CHANGED);
    expect(changed?.actorUserId).toBe(admin.id);
    expect(changed?.before).toMatchObject({discountPercent: 0});
    expect(changed?.after).toMatchObject({discountPercent: 15});
  });

  it("rejects therapists, 100 percent and unknown users", async () => {
    const admin = await createAdmin();
    const therapist = await createTherapist("no-discount");

    await expect(
      setUserRoomDiscount({
        actor: therapist,
        targetUserId: therapist.id,
        discountPercent: 10,
      }),
    ).rejects.toBeInstanceOf(RoomError);

    await expect(
      setUserRoomDiscount({
        actor: admin,
        targetUserId: therapist.id,
        discountPercent: 100,
      }),
    ).rejects.toMatchObject({code: "invalidDiscount"});
  });
});

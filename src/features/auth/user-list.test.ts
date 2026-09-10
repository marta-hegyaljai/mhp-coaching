import {afterAll, describe, expect, it} from "vitest";

import {closeDb} from "@/db";
import {getDatabaseUrl} from "@/lib/database-url";
import {hashPassword} from "@/features/auth/password";
import {normalizeEmail} from "@/features/auth/email";
import {insertUser, listUsersPage, updateUser} from "@/features/auth/repository";
import {UniqueEmailError} from "@/features/auth/unique-email";
import {toAdminUserView} from "@/features/admin/user-view";
import {defaultUserListQuery} from "@/features/admin/user-list-query";

const hasDatabase = Boolean(getDatabaseUrl());

describe.skipIf(!hasDatabase)("admin user directory", () => {
  afterAll(async () => {
    await closeDb();
  });

  async function insertListedUser(input: {
    email: string;
    firstName: string;
    lastName: string;
    isAdmin?: boolean;
    roomBookingEnabled?: boolean;
    passwordHash?: string | null;
    disabledAt?: Date | null;
  }) {
    const user = await insertUser({
      email: input.email,
      emailNormalized: normalizeEmail(input.email),
      firstName: input.firstName,
      lastName: input.lastName,
      locale: "en",
      isAdmin: input.isAdmin,
      roomBookingEnabled: input.roomBookingEnabled,
      passwordHash: input.passwordHash,
    });

    if (input.disabledAt) {
      return updateUser(user.id, {disabledAt: input.disabledAt});
    }

    return user;
  }

  it("rejects a second user with the same email, including case variants", async () => {
    const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `Unique.User+${stamp}@Example.TEST`;

    await insertListedUser({
      email,
      firstName: "Unique",
      lastName: "One",
      passwordHash: await hashPassword("user-password-12"),
    });

    await expect(
      insertListedUser({
        email: email.toLowerCase(),
        firstName: "Copy",
        lastName: "Two",
        passwordHash: await hashPassword("user-password-12"),
      }),
    ).rejects.toBeInstanceOf(UniqueEmailError);
  });

  it("pages, searches by email, and filters status and access on the server", async () => {
    const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = (label: string) => `${label}.${stamp}@listdir.test`;
    const passwordHash = await hashPassword("user-password-12");

    await insertListedUser({
      email: email("admin"),
      firstName: "Ada",
      lastName: "Admin",
      isAdmin: true,
      passwordHash,
    });
    await insertListedUser({
      email: email("rooms"),
      firstName: "Theo",
      lastName: `Lister${stamp}`,
      roomBookingEnabled: true,
      passwordHash,
    });
    const disabled = await insertListedUser({
      email: email("disabled"),
      firstName: "Dis",
      lastName: "Able",
      passwordHash,
      disabledAt: new Date(),
    });
    await insertListedUser({
      email: email("pending"),
      firstName: "Pat",
      lastName: "Pending",
    });

    for (let index = 0; index < 8; index += 1) {
      await insertListedUser({
        email: email(`extra${String(index).padStart(2, "0")}`),
        firstName: "Extra",
        lastName: `User${index}`,
        passwordHash,
      });
    }

    const page1 = await listUsersPage(
      {...defaultUserListQuery, q: stamp},
      {pageSize: 5},
    );
    expect(page1.total).toBe(12);
    expect(page1.pageCount).toBe(3);
    expect(page1.users).toHaveLength(5);
    expect(page1.users.map((user) => user.emailNormalized)).toEqual(
      [...page1.users].map((user) => user.emailNormalized).sort(),
    );

    const page3 = await listUsersPage(
      {...defaultUserListQuery, q: stamp, page: 3},
      {pageSize: 5},
    );
    expect(page3.page).toBe(3);
    expect(page3.users).toHaveLength(2);

    const found = await listUsersPage(
      {...defaultUserListQuery, q: email("disabled")},
      {pageSize: 5},
    );
    expect(found.users.map((user) => user.id)).toEqual([disabled.id]);
    expect(toAdminUserView(disabled)).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(toAdminUserView(disabled))).not.toContain("scrypt$");

    const byName = await listUsersPage(
      {...defaultUserListQuery, q: `lister${stamp}`},
      {pageSize: 5},
    );
    expect(byName.users.map((user) => user.firstName)).toEqual(["Theo"]);

    const disabledOnly = await listUsersPage(
      {...defaultUserListQuery, q: stamp, status: "disabled"},
      {pageSize: 5},
    );
    expect(disabledOnly.total).toBe(1);
    expect(disabledOnly.users[0]?.id).toBe(disabled.id);

    const pendingOnly = await listUsersPage(
      {...defaultUserListQuery, q: stamp, status: "pending"},
      {pageSize: 5},
    );
    expect(pendingOnly.total).toBe(1);
    expect(pendingOnly.users[0]?.firstName).toBe("Pat");

    const admins = await listUsersPage(
      {...defaultUserListQuery, q: stamp, access: "admin"},
      {pageSize: 5},
    );
    expect(admins.total).toBe(1);
    expect(admins.users[0]?.isAdmin).toBe(true);

    const rooms = await listUsersPage(
      {...defaultUserListQuery, q: stamp, access: "rooms"},
      {pageSize: 5},
    );
    expect(rooms.total).toBe(1);
    expect(rooms.users[0]?.roomBookingEnabled).toBe(true);
  });
});

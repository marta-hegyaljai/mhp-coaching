import {afterAll, describe, expect, it} from "vitest";

import {closeDb} from "@/db";
import {linkUnownedBookingsForVerifiedUser} from "@/features/account/link-bookings";
import {listMyCourses} from "@/features/account/my-courses";
import {createPendingBooking} from "@/features/bookings/repository";
import {RECOVERY_MAX_ATTEMPTS, SIGN_UP_MAX_ATTEMPTS} from "@/features/auth/constants";
import {normalizeEmail} from "@/features/auth/email";
import {hashPassword} from "@/features/auth/password";
import {canAuthenticate} from "@/features/auth/policy";
import {updateAccountProfile} from "@/features/auth/profile";
import {changeSignedInPassword, requestPasswordReset, resetPasswordWithToken} from "@/features/auth/recovery";
import {registerAccount, verifySignupEmail} from "@/features/auth/register";
import {
  countAuthAttempts,
  findActiveSessionByTokenHash,
  findUserByNormalizedEmail,
  insertAuthToken,
  insertSession,
  insertUser,
  recordAuthAttempt,
} from "@/features/auth/repository";
import {hashToken} from "@/features/auth/tokens";
import {getDatabaseUrl} from "@/lib/database-url";

const hasDatabase = Boolean(getDatabaseUrl());

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
}

async function guestBooking(email: string, dates: {start: string; end?: string}) {
  return createPendingBooking({
    firstName: "Ada",
    lastName: "Guest",
    dateOfBirth: "1975-12-10",
    email,
    phone: "+41 79 000 00 00",
    street: "Chemin de la Fenetta 42",
    postalCode: "1752",
    city: "Villars-sur-Glâne",
    country: "CH",
    locale: "en",
    courseId: "omni-practitioner",
    courseDateId: `omni-practitioner-${dates.start}`,
    courseTitle: "OMNI Hypnosis Practitioner",
    courseDateStart: dates.start,
    courseDateEnd: dates.end,
    location: "Fribourg",
    amountMinor: 349000,
    currency: "chf",
    paymentProvider: "fake",
    privacyAcceptedAt: new Date(),
    status: "PAID",
  });
}

describe.skipIf(!hasDatabase)("CP-01 public accounts", () => {
  afterAll(async () => {
    await closeDb();
  });

  it("creates an unverified account and withholds history until verification", async () => {
    const email = uniqueEmail("signup");
    const guest = await guestBooking(email, {start: "2026-09-10", end: "2026-09-20"});
    expect(guest.userId).toBeNull();
    expect(guest.emailNormalized).toBe(normalizeEmail(email));

    const registered = await registerAccount({
      firstName: "Ada",
      lastName: "Lovelace",
      email,
      password: "correct-horse-12",
      passwordConfirm: "correct-horse-12",
      locale: "en",
    });
    expect(registered.ok).toBe(true);
    if (!registered.ok || registered.outcome !== "created") {
      throw new Error("expected a created account");
    }
    expect(registered.outcome).toBe("created");
    expect(registered.user.emailVerifiedAt).toBeNull();
    expect(canAuthenticate(registered.user)).toBe(false);
    expect(await linkUnownedBookingsForVerifiedUser(registered.user)).toBe(0);
    expect(await listMyCourses(registered.user.id)).toEqual({upcoming: [], past: []});

    const duplicate = await registerAccount({
      firstName: "Ada",
      lastName: "Lovelace",
      email,
      password: "correct-horse-12",
      passwordConfirm: "correct-horse-12",
      locale: "en",
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok || duplicate.outcome !== "resent") {
      throw new Error("expected generic success");
    }
    expect(duplicate.outcome).toBe("resent");

    const verified = await verifySignupEmail(registered.rawToken);
    expect(verified.ok).toBe(false);

    const token = duplicate.rawToken;
    expect(token).toBeTruthy();
    const confirmed = await verifySignupEmail(token!);
    expect(confirmed.ok).toBe(true);
    if (!confirmed.ok) {
      throw new Error("expected verification");
    }
    expect(confirmed.user.emailVerifiedAt).not.toBeNull();
    expect(canAuthenticate(confirmed.user)).toBe(true);

    const linked = await linkUnownedBookingsForVerifiedUser(confirmed.user);
    expect(linked).toBe(0);
    const mine = await listMyCourses(confirmed.user.id, "2026-09-01");
    expect(mine.upcoming.map((row) => row.id)).toEqual([guest.id]);

    const again = await linkUnownedBookingsForVerifiedUser(confirmed.user);
    expect(again).toBe(0);
    const reused = await verifySignupEmail(token!);
    expect(reused.ok).toBe(false);

    const hijack = await registerAccount({
      firstName: "Ada",
      lastName: "Lovelace",
      email,
      password: "correct-horse-12",
      passwordConfirm: "correct-horse-12",
      locale: "en",
    });
    expect(hijack.ok && hijack.outcome).toBe("already_registered");
  });

  it("does not let an existing invitation or verified account be hijacked by sign-up", async () => {
    const invitedEmail = uniqueEmail("invited");
    await insertUser({
      email: invitedEmail,
      emailNormalized: normalizeEmail(invitedEmail),
      firstName: "Invited",
      lastName: "User",
      locale: "en",
    });
    const invited = await registerAccount({
      firstName: "Other",
      lastName: "Person",
      email: invitedEmail,
      password: "correct-horse-12",
      passwordConfirm: "correct-horse-12",
      locale: "en",
    });
    expect(invited.ok && invited.outcome).toBe("invite_pending");
    const stillInvited = await findUserByNormalizedEmail(normalizeEmail(invitedEmail));
    expect(stillInvited?.passwordHash).toBeNull();
    expect(stillInvited?.firstName).toBe("Invited");
  });

  it("resets a password, revokes sessions, and rejects expired or reused tokens", async () => {
    const email = uniqueEmail("reset");
    const user = await insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Reset",
      lastName: "User",
      locale: "en",
      passwordHash: await hashPassword("old-password-12"),
      emailVerifiedAt: new Date(),
    });
    const oldHash = hashToken(`old-${user.id}`);
    await insertSession({
      userId: user.id,
      tokenHash: oldHash,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const expiredRaw = `expired-${user.id}`;
    await insertAuthToken({
      userId: user.id,
      purpose: "recovery",
      tokenHash: hashToken(expiredRaw),
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(await resetPasswordWithToken({
      rawToken: expiredRaw,
      password: "new-password-12",
      passwordConfirm: "new-password-12",
    })).toMatchObject({ok: false, reason: "invalid"});

    const requested = await requestPasswordReset(email);
    expect(requested.rawToken).toBeTruthy();
    expect(await resetPasswordWithToken({
      rawToken: "not-a-token",
      password: "new-password-12",
      passwordConfirm: "new-password-12",
    })).toMatchObject({ok: false, reason: "invalid"});

    const reset = await resetPasswordWithToken({
      rawToken: requested.rawToken!,
      password: "new-password-12",
      passwordConfirm: "new-password-12",
    });
    expect(reset.ok).toBe(true);
    expect(await findActiveSessionByTokenHash(oldHash)).toBeUndefined();
    const reused = await resetPasswordWithToken({
      rawToken: requested.rawToken!,
      password: "newer-password-12",
      passwordConfirm: "newer-password-12",
    });
    expect(reused.ok).toBe(false);
  });

  it("uses recovery to activate a pre-provisioned passwordless account", async () => {
    const email = uniqueEmail("passwordless-reset");
    const user = await insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Pre-provisioned",
      lastName: "User",
      locale: "en",
    });

    expect(user.passwordHash).toBeNull();
    expect(user.emailVerifiedAt).toBeNull();

    const requested = await requestPasswordReset(email);
    expect(requested.rawToken).toBeTruthy();

    const reset = await resetPasswordWithToken({
      rawToken: requested.rawToken!,
      password: "new-password-12",
      passwordConfirm: "new-password-12",
    });
    expect(reset.ok).toBe(true);
    if (!reset.ok) {
      throw new Error("expected passwordless account activation");
    }
    expect(reset.user.passwordHash).toBeTruthy();
    expect(reset.user.emailVerifiedAt).not.toBeNull();
    expect(canAuthenticate(reset.user)).toBe(true);
  });

  it("changes a signed-in password and keeps the current session", async () => {
    const email = uniqueEmail("change");
    const user = await insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Change",
      lastName: "User",
      locale: "en",
      passwordHash: await hashPassword("old-password-12"),
      emailVerifiedAt: new Date(),
    });
    const keepHash = hashToken(`keep-${user.id}`);
    const dropHash = hashToken(`drop-${user.id}`);
    await insertSession({
      userId: user.id,
      tokenHash: keepHash,
      expiresAt: new Date(Date.now() + 60_000),
    });
    await insertSession({
      userId: user.id,
      tokenHash: dropHash,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const current = await findActiveSessionByTokenHash(keepHash);
    expect(current?.sessionId).toBeTruthy();

    const changed = await changeSignedInPassword({
      user,
      currentPassword: "old-password-12",
      password: "new-password-12",
      passwordConfirm: "new-password-12",
      currentSessionId: current!.sessionId,
    });
    expect(changed.ok).toBe(true);
    expect(await findActiveSessionByTokenHash(keepHash)).toBeTruthy();
    expect(await findActiveSessionByTokenHash(dropHash)).toBeUndefined();

    const wrong = await changeSignedInPassword({
      user: changed.ok ? changed.user : user,
      currentPassword: "old-password-12",
      password: "newer-password-12",
      passwordConfirm: "newer-password-12",
      currentSessionId: current!.sessionId,
    });
    expect(wrong).toMatchObject({ok: false, reason: "current"});
  });

  it("updates name and locale without changing the account email", async () => {
    const email = uniqueEmail("stable");
    const user = await insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Stable",
      lastName: "Mail",
      locale: "en",
      passwordHash: await hashPassword("user-password-12"),
      emailVerifiedAt: new Date(),
    });

    const updated = await updateAccountProfile({
      user,
      firstName: "Renamed",
      lastName: "Person",
      locale: "fr",
    });

    expect(updated.ok).toBe(true);
    if (!updated.ok) {
      throw new Error("expected profile update");
    }
    expect(updated.user.email).toBe(email);
    expect(updated.user.emailNormalized).toBe(normalizeEmail(email));
    expect(updated.user.firstName).toBe("Renamed");
    expect(updated.user.lastName).toBe("Person");
    expect(updated.user.locale).toBe("fr");
    const persisted = await findUserByNormalizedEmail(normalizeEmail(email));
    expect(persisted?.email).toBe(email);
    expect(persisted?.firstName).toBe("Renamed");
  });

  it("attaches a signed-in booking to that user and leaves guest bookings unowned", async () => {
    const email = uniqueEmail("booker");
    const user = await insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Book",
      lastName: "Er",
      locale: "en",
      passwordHash: await hashPassword("user-password-12"),
      emailVerifiedAt: new Date(),
    });
    const owned = await createPendingBooking({
      firstName: "Book",
      lastName: "Er",
      dateOfBirth: "1975-12-10",
      email,
      phone: "+41 79 000 00 00",
      street: "Chemin de la Fenetta 42",
      postalCode: "1752",
      city: "Villars-sur-Glâne",
      country: "CH",
      locale: "en",
      courseId: "omni-practitioner",
      courseDateId: "omni-practitioner-owned",
      courseTitle: "OMNI Hypnosis Practitioner",
      courseDateStart: "2026-12-01",
      location: "Fribourg",
      amountMinor: 349000,
      currency: "chf",
      paymentProvider: "fake",
      privacyAcceptedAt: new Date(),
      userId: user.id,
    });
    const guest = await guestBooking(uniqueEmail("anon"), {start: "2026-12-02"});
    expect(owned.userId).toBe(user.id);
    expect(guest.userId).toBeNull();
    const mine = await listMyCourses(user.id, "2026-11-01");
    expect(mine.upcoming.map((row) => row.id)).toEqual([owned.id]);
    expect(mine.upcoming.map((row) => row.id)).not.toContain(guest.id);
  });

  it("counts sign-up and recovery attempts for rate limits", async () => {
    const email = uniqueEmail("limits");
    const subject = `email:${normalizeEmail(email)}`;
    for (let index = 0; index < SIGN_UP_MAX_ATTEMPTS; index += 1) {
      await recordAuthAttempt("sign_up", subject);
    }
    const since = new Date(Date.now() - 15 * 60 * 1000);
    expect(await countAuthAttempts("sign_up", subject, since)).toBeGreaterThanOrEqual(
      SIGN_UP_MAX_ATTEMPTS,
    );
    for (let index = 0; index < RECOVERY_MAX_ATTEMPTS; index += 1) {
      await recordAuthAttempt("recovery", subject);
    }
    expect(await countAuthAttempts("recovery", subject, since)).toBeGreaterThanOrEqual(
      RECOVERY_MAX_ATTEMPTS,
    );
  });
});

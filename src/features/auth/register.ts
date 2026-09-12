import type {User} from "@/db/schema";
import {linkUnownedBookingsForVerifiedUser} from "@/features/account/link-bookings";
import {hydrateUserContactFromBookings} from "@/features/auth/contact";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {isValidEmail, normalizeEmail} from "@/features/auth/email";
import {issueAuthToken} from "@/features/auth/issue-token";
import {hashPassword, passwordErrors} from "@/features/auth/password";
import {isValidPersonName, trimPersonName} from "@/features/auth/person-name";
import {
  findUserById,
  findUserByNormalizedEmail,
  findValidAuthToken,
  insertUser,
  markAuthTokenConsumed,
  recordAudit,
  updateUser,
} from "@/features/auth/repository";
import {UniqueEmailError} from "@/features/auth/unique-email";
import {hashToken} from "@/features/auth/tokens";
import type {AppLocale} from "@/i18n/routing";

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  locale: AppLocale;
};

export type RegisterFieldError = "firstName" | "lastName" | "email" | "password" | "passwordConfirm";

export type RegisterResult =
  | {ok: false; fieldErrors: Partial<Record<RegisterFieldError, true>>}
  | {
      ok: true;
      outcome: "created" | "resent";
      user: User;
      rawToken: string;
    }
  | {
      ok: true;
      outcome: "already_registered" | "disabled" | "invite_pending";
    };

export async function registerAccount(input: RegisterInput): Promise<RegisterResult> {
  const firstName = trimPersonName(input.firstName);
  const lastName = trimPersonName(input.lastName);
  const email = input.email.trim();
  const fieldErrors: Partial<Record<RegisterFieldError, true>> = {};

  if (!isValidPersonName(firstName)) {
    fieldErrors.firstName = true;
  }
  if (!isValidPersonName(lastName)) {
    fieldErrors.lastName = true;
  }
  if (!isValidEmail(email)) {
    fieldErrors.email = true;
  }

  const issues = passwordErrors(input.password, input.passwordConfirm, email);
  if (issues.includes("tooShort") || issues.includes("tooLong") || issues.includes("sameAsEmail")) {
    fieldErrors.password = true;
  }
  if (issues.includes("mismatch")) {
    fieldErrors.passwordConfirm = true;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {ok: false, fieldErrors};
  }

  const emailNormalized = normalizeEmail(email);
  const existing = await findUserByNormalizedEmail(emailNormalized);

  if (existing) {
    return resendVerificationIfPending(existing);
  }

  try {
    const passwordHash = await hashPassword(input.password);
    const user = await insertUser({
      email,
      emailNormalized,
      firstName,
      lastName,
      locale: input.locale,
      passwordHash,
      emailVerifiedAt: null,
    });
    const rawToken = await issueAuthToken(user.id, "verify");
    await recordAudit({
      actorUserId: user.id,
      targetUserId: user.id,
      action: AUDIT_ACTIONS.USER_REGISTERED,
      after: {emailNormalized, pendingInvite: false},
    });
    return {ok: true, outcome: "created", user, rawToken};
  } catch (error) {
    if (error instanceof UniqueEmailError) {
      const raced = await findUserByNormalizedEmail(emailNormalized);
      if (raced) {
        return resendVerificationIfPending(raced);
      }
      return {ok: true, outcome: "already_registered"};
    }
    throw error;
  }
}

function existingRegisterOutcome(user: User): Extract<RegisterResult, {ok: true}> {
  if (user.disabledAt) {
    return {ok: true, outcome: "disabled"};
  }
  if (user.emailVerifiedAt) {
    return {ok: true, outcome: "already_registered"};
  }
  if (!user.passwordHash) {
    return {ok: true, outcome: "invite_pending"};
  }
  return {ok: true, outcome: "already_registered"};
}

async function resendVerificationIfPending(user: User): Promise<Extract<RegisterResult, {ok: true}>> {
  if (user.disabledAt || user.emailVerifiedAt || !user.passwordHash) {
    return existingRegisterOutcome(user);
  }

  const rawToken = await issueAuthToken(user.id, "verify");
  return {ok: true, outcome: "resent", user, rawToken};
}

export async function verifySignupEmail(rawToken: string): Promise<
  | {ok: true; user: User}
  | {ok: false; reason: "invalid"}
> {
  if (!rawToken) {
    return {ok: false, reason: "invalid"};
  }

  const token = await findValidAuthToken(hashToken(rawToken), "verify");
  if (!token) {
    return {ok: false, reason: "invalid"};
  }

  const user = await findUserById(token.userId);
  if (!user || user.disabledAt) {
    return {ok: false, reason: "invalid"};
  }

  await markAuthTokenConsumed(token.id);

  const ready = user.emailVerifiedAt
    ? user
    : await updateUser(user.id, {emailVerifiedAt: new Date()});

  await linkUnownedBookingsForVerifiedUser(ready);
  const withContact = await hydrateUserContactFromBookings(ready);
  await recordAudit({
    actorUserId: withContact.id,
    targetUserId: withContact.id,
    action: AUDIT_ACTIONS.EMAIL_VERIFIED,
    after: {emailNormalized: withContact.emailNormalized},
  });

  return {ok: true, user: withContact};
}

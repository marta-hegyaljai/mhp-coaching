import type {User} from "@/db/schema";
import {linkUnownedBookingsForVerifiedUser} from "@/features/account/link-bookings";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {isValidEmail, normalizeEmail} from "@/features/auth/email";
import {issueAuthToken} from "@/features/auth/issue-token";
import {hashPassword, passwordErrors, verifyPassword} from "@/features/auth/password";
import {isEnabledAccount} from "@/features/auth/policy";
import {
  findUserById,
  findUserByNormalizedEmail,
  findValidAuthToken,
  markAuthTokenConsumed,
  recordAudit,
  revokeAllSessionsForUser,
  revokeOtherSessionsForUser,
  updateUser,
} from "@/features/auth/repository";
import {hashToken} from "@/features/auth/tokens";

export type RecoveryRequestResult = {
  rawToken?: string;
  user?: User;
};

export async function requestPasswordReset(email: string): Promise<RecoveryRequestResult> {
  if (!isValidEmail(email)) {
    return {};
  }

  const user = await findUserByNormalizedEmail(normalizeEmail(email));
  if (!user || !isEnabledAccount(user)) {
    return {};
  }

  const rawToken = await issueAuthToken(user.id, "recovery");
  return {rawToken, user};
}

export async function resetPasswordWithToken(input: {
  rawToken: string;
  password: string;
  passwordConfirm: string;
}): Promise<
  | {ok: true; user: User}
  | {ok: false; reason: "invalid"}
  | {ok: false; reason: "password"; issues: ReturnType<typeof passwordErrors>}
> {
  if (!input.rawToken) {
    return {ok: false, reason: "invalid"};
  }

  const token = await findValidAuthToken(hashToken(input.rawToken), "recovery");
  if (!token) {
    return {ok: false, reason: "invalid"};
  }

  const user = await findUserById(token.userId);
  if (!user || !isEnabledAccount(user)) {
    return {ok: false, reason: "invalid"};
  }

  const issues = passwordErrors(input.password, input.passwordConfirm, user.email);
  if (issues.length > 0) {
    return {ok: false, reason: "password", issues};
  }

  const passwordHash = await hashPassword(input.password);
  await markAuthTokenConsumed(token.id);
  const wasUnverified = !user.emailVerifiedAt;
  const updated = await updateUser(user.id, {
    passwordHash,
    ...(wasUnverified ? {emailVerifiedAt: new Date()} : {}),
  });
  await revokeAllSessionsForUser(user.id);
  if (wasUnverified) {
    await linkUnownedBookingsForVerifiedUser(updated);
    await recordAudit({
      actorUserId: user.id,
      targetUserId: user.id,
      action: AUDIT_ACTIONS.EMAIL_VERIFIED,
      after: {emailNormalized: updated.emailNormalized},
    });
  }
  await recordAudit({
    actorUserId: user.id,
    targetUserId: user.id,
    action: AUDIT_ACTIONS.PASSWORD_RESET,
  });

  return {ok: true, user: updated};
}

export async function changeSignedInPassword(input: {
  user: User;
  currentPassword: string;
  password: string;
  passwordConfirm: string;
  currentSessionId: string;
}): Promise<
  | {ok: true; user: User}
  | {ok: false; reason: "current"}
  | {ok: false; reason: "password"; issues: ReturnType<typeof passwordErrors>}
> {
  if (!input.user.passwordHash) {
    return {ok: false, reason: "current"};
  }

  const currentOk = await verifyPassword(input.currentPassword, input.user.passwordHash);
  if (!currentOk) {
    return {ok: false, reason: "current"};
  }

  const issues = passwordErrors(input.password, input.passwordConfirm, input.user.email);
  if (issues.length > 0) {
    return {ok: false, reason: "password", issues};
  }

  const passwordHash = await hashPassword(input.password);
  const updated = await updateUser(input.user.id, {passwordHash});
  await revokeOtherSessionsForUser(input.user.id, input.currentSessionId);
  await recordAudit({
    actorUserId: input.user.id,
    targetUserId: input.user.id,
    action: AUDIT_ACTIONS.PASSWORD_CHANGED,
  });

  return {ok: true, user: updated};
}

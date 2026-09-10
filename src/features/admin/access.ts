import type {User} from "@/db/schema";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {
  accessSnapshot,
  countEnabledAdmins,
  findUserById,
  findUserByNormalizedEmail,
  insertInviteToken,
  insertUser,
  recordAudit,
  revokeAllSessionsForUser,
  updateUser,
} from "@/features/auth/repository";
import {UniqueEmailError} from "@/features/auth/unique-email";
import {INVITE_TTL_MS} from "@/features/auth/constants";
import {isValidEmail, normalizeEmail} from "@/features/auth/email";
import {hashToken, randomToken} from "@/features/auth/tokens";
import {sendAccountInvitation} from "@/features/email/invitation";
import type {AppLocale} from "@/i18n/routing";

export type AccessError =
  | "invalidEmail"
  | "invalidName"
  | "alreadyRegistered"
  | "notFound"
  | "cannotDisableSelf"
  | "cannotDemoteLastAdmin"
  | "forbidden";

export class AccessControlError extends Error {
  constructor(readonly code: AccessError) {
    super(code);
    this.name = "AccessControlError";
  }
}

function requireName(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 80) {
    throw new AccessControlError("invalidName");
  }
  return trimmed;
}

export async function inviteUser(input: {
  actor: User;
  email: string;
  firstName: string;
  lastName: string;
  locale: AppLocale;
  isAdmin: boolean;
  roomBookingEnabled: boolean;
}): Promise<{user: User; resent: boolean}> {
  if (!isValidEmail(input.email)) {
    throw new AccessControlError("invalidEmail");
  }

  const firstName = requireName(input.firstName);
  const lastName = requireName(input.lastName);
  const emailNormalized = normalizeEmail(input.email);
  let existing = await findUserByNormalizedEmail(emailNormalized);

  if (existing?.passwordHash) {
    throw new AccessControlError("alreadyRegistered");
  }

  let user = existing;
  if (!user) {
    try {
      user = await insertUser({
        email: input.email.trim(),
        emailNormalized,
        firstName,
        lastName,
        locale: input.locale,
        isAdmin: input.isAdmin,
        roomBookingEnabled: input.roomBookingEnabled,
      });
    } catch (error) {
      if (!(error instanceof UniqueEmailError)) {
        throw error;
      }
      existing = await findUserByNormalizedEmail(emailNormalized);
      if (!existing || existing.passwordHash) {
        throw new AccessControlError("alreadyRegistered");
      }
      user = existing;
    }
  }

  if (!user) {
    throw new AccessControlError("notFound");
  }

  const resent = Boolean(existing);
  const before = existing ? accessSnapshot(existing) : null;
  let target = user;

  if (existing) {
    target = await updateUser(existing.id, {
      firstName,
      lastName,
      locale: input.locale,
      isAdmin: input.isAdmin,
      roomBookingEnabled: input.roomBookingEnabled,
    });
  }

  const rawToken = randomToken();
  await insertInviteToken({
    userId: target.id,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  });

  await recordAudit({
    actorUserId: input.actor.id,
    targetUserId: target.id,
    action: resent ? AUDIT_ACTIONS.USER_REINVITED : AUDIT_ACTIONS.USER_INVITED,
    before,
    after: accessSnapshot(target),
  });

  if (existing && existing.isAdmin !== target.isAdmin) {
    await recordAudit({
      actorUserId: input.actor.id,
      targetUserId: target.id,
      action: target.isAdmin ? AUDIT_ACTIONS.ADMIN_GRANTED : AUDIT_ACTIONS.ADMIN_REVOKED,
      before,
      after: accessSnapshot(target),
    });
  }

  if (existing && existing.roomBookingEnabled !== target.roomBookingEnabled) {
    await recordAudit({
      actorUserId: input.actor.id,
      targetUserId: target.id,
      action: target.roomBookingEnabled
        ? AUDIT_ACTIONS.ROOM_BOOKING_GRANTED
        : AUDIT_ACTIONS.ROOM_BOOKING_REVOKED,
      before,
      after: accessSnapshot(target),
    });
  }

  await sendAccountInvitation({
    user: target,
    locale: input.locale,
    rawToken,
  });

  return {user: target, resent};
}

export async function setUserDisabled(input: {
  actor: User;
  targetUserId: string;
  disabled: boolean;
}): Promise<User> {
  if (input.actor.id === input.targetUserId && input.disabled) {
    throw new AccessControlError("cannotDisableSelf");
  }

  const target = await findUserById(input.targetUserId);

  if (!target) {
    throw new AccessControlError("notFound");
  }

  if (input.disabled && target.isAdmin && target.disabledAt === null) {
    const remaining = await countEnabledAdmins(target.id);
    if (remaining === 0) {
      throw new AccessControlError("cannotDemoteLastAdmin");
    }
  }

  const before = accessSnapshot(target);
  const updated = await updateUser(target.id, {
    disabledAt: input.disabled ? new Date() : null,
  });

  if (input.disabled) {
    await revokeAllSessionsForUser(target.id);
  }

  await recordAudit({
    actorUserId: input.actor.id,
    targetUserId: target.id,
    action: input.disabled ? AUDIT_ACTIONS.USER_DISABLED : AUDIT_ACTIONS.USER_ENABLED,
    before,
    after: accessSnapshot(updated),
  });

  return updated;
}

export async function setUserAdmin(input: {
  actor: User;
  targetUserId: string;
  isAdmin: boolean;
}): Promise<User> {
  const target = await findUserById(input.targetUserId);

  if (!target) {
    throw new AccessControlError("notFound");
  }

  if (!input.isAdmin && target.isAdmin && target.disabledAt === null) {
    const remaining = await countEnabledAdmins(target.id);
    if (remaining === 0) {
      throw new AccessControlError("cannotDemoteLastAdmin");
    }
  }

  if (target.isAdmin === input.isAdmin) {
    return target;
  }

  const before = accessSnapshot(target);
  const updated = await updateUser(target.id, {isAdmin: input.isAdmin});

  await recordAudit({
    actorUserId: input.actor.id,
    targetUserId: target.id,
    action: input.isAdmin ? AUDIT_ACTIONS.ADMIN_GRANTED : AUDIT_ACTIONS.ADMIN_REVOKED,
    before,
    after: accessSnapshot(updated),
  });

  return updated;
}

export async function setUserRoomBooking(input: {
  actor: User;
  targetUserId: string;
  enabled: boolean;
}): Promise<User> {
  const target = await findUserById(input.targetUserId);

  if (!target) {
    throw new AccessControlError("notFound");
  }

  if (target.roomBookingEnabled === input.enabled) {
    return target;
  }

  const before = accessSnapshot(target);
  const updated = await updateUser(target.id, {roomBookingEnabled: input.enabled});

  await recordAudit({
    actorUserId: input.actor.id,
    targetUserId: target.id,
    action: input.enabled
      ? AUDIT_ACTIONS.ROOM_BOOKING_GRANTED
      : AUDIT_ACTIONS.ROOM_BOOKING_REVOKED,
    before,
    after: accessSnapshot(updated),
  });

  return updated;
}

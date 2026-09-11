import {and, count, desc, eq, gt, isNotNull, isNull, ne, or, sql} from "drizzle-orm";
import type {SQL} from "drizzle-orm";

import {getDb} from "@/db";
import {
  authAttempts,
  authTokens,
  auditEvents,
  sessions,
  users,
  type AuthToken,
  type AuthTokenPurpose,
  type User,
} from "@/db/schema";
import {AUDIT_ACTIONS, type AuditAction} from "@/features/admin/audit-actions";
import {
  USER_LIST_PAGE_SIZE,
  type UserListQuery,
} from "@/features/admin/user-list-query";
import {normalizeEmail} from "@/features/auth/email";
import {
  UniqueEmailError,
  isUniqueViolation,
} from "@/features/auth/unique-email";

export type AccessSnapshot = {
  isAdmin: boolean;
  roomBookingEnabled: boolean;
  roomDiscountPercent: number;
  disabled: boolean;
  pendingInvite: boolean;
};

export function accessSnapshot(user: User): AccessSnapshot {
  return {
    isAdmin: user.isAdmin,
    roomBookingEnabled: user.roomBookingEnabled,
    roomDiscountPercent: user.roomDiscountPercent,
    disabled: user.disabledAt !== null,
    pendingInvite: user.passwordHash === null,
  };
}

export async function findUserById(id: string): Promise<User | undefined> {
  const [user] = await getDb().select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}

export async function findUserByNormalizedEmail(
  emailNormalized: string,
): Promise<User | undefined> {
  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.emailNormalized, emailNormalized))
    .limit(1);
  return user;
}

function userListFilters(query: UserListQuery): SQL | undefined {
  const filters: SQL[] = [];
  const needle = normalizeEmail(query.q);

  if (needle) {
    const match = or(
      sql`position(${needle} in ${users.emailNormalized}) > 0`,
      sql`position(${needle} in lower(${users.email})) > 0`,
      sql`position(${needle} in lower(${users.firstName} || ' ' || ${users.lastName})) > 0`,
    );
    if (match) {
      filters.push(match);
    }
  }

  if (query.status === "active") {
    filters.push(isNull(users.disabledAt), isNotNull(users.passwordHash));
  } else if (query.status === "pending") {
    filters.push(isNull(users.disabledAt), isNull(users.passwordHash));
  } else if (query.status === "disabled") {
    filters.push(isNotNull(users.disabledAt));
  }

  if (query.access === "admin") {
    filters.push(eq(users.isAdmin, true));
  } else if (query.access === "rooms") {
    filters.push(eq(users.roomBookingEnabled, true));
  } else if (query.access === "none") {
    filters.push(eq(users.isAdmin, false), eq(users.roomBookingEnabled, false));
  }

  if (filters.length === 0) {
    return undefined;
  }
  if (filters.length === 1) {
    return filters[0];
  }
  return and(...filters);
}

export async function listUsersPage(
  query: UserListQuery,
  options?: {pageSize?: number},
): Promise<{
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}> {
  const pageSize = Math.min(
    100,
    Math.max(1, options?.pageSize ?? USER_LIST_PAGE_SIZE),
  );
  const where = userListFilters(query);
  const db = getDb();

  const [totalRow] = await db
    .select({value: count()})
    .from(users)
    .where(where);

  const total = Number(totalRow?.value ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, query.page), pageCount);
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select()
    .from(users)
    .where(where)
    .orderBy(users.emailNormalized, users.id)
    .limit(pageSize)
    .offset(offset);

  return {users: rows, total, page, pageSize, pageCount};
}

export async function countEnabledAdmins(exceptUserId?: string): Promise<number> {
  const filters = [
    eq(users.isAdmin, true),
    isNull(users.disabledAt),
  ];

  if (exceptUserId) {
    filters.push(ne(users.id, exceptUserId));
  }

  const [row] = await getDb()
    .select({value: count()})
    .from(users)
    .where(and(...filters));

  return Number(row?.value ?? 0);
}

export async function insertUser(input: {
  email: string;
  emailNormalized: string;
  firstName: string;
  lastName: string;
  locale: string;
  isAdmin?: boolean;
  roomBookingEnabled?: boolean;
  passwordHash?: string | null;
  emailVerifiedAt?: Date | null;
}): Promise<User> {
  try {
    const [user] = await getDb()
      .insert(users)
      .values({
        email: input.email.trim(),
        emailNormalized: input.emailNormalized,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        locale: input.locale,
        isAdmin: input.isAdmin ?? false,
        roomBookingEnabled: input.roomBookingEnabled ?? false,
        passwordHash: input.passwordHash ?? null,
        emailVerifiedAt: input.emailVerifiedAt ?? null,
      })
      .returning();

    return user;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new UniqueEmailError();
    }
    throw error;
  }
}

export async function updateUser(
  userId: string,
  values: Partial<
    Pick<
      User,
      | "passwordHash"
      | "emailVerifiedAt"
      | "isAdmin"
      | "roomBookingEnabled"
      | "disabledAt"
      | "firstName"
      | "lastName"
      | "locale"
      | "email"
      | "emailNormalized"
      | "pendingEmail"
      | "pendingEmailNormalized"
      | "roomDiscountPercent"
    >
  >,
): Promise<User> {
  const [user] = await getDb()
    .update(users)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return user;
}

export async function insertSession(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  await getDb().insert(sessions).values({
    userId: input.userId,
    tokenHash: input.tokenHash,
    expiresAt: input.expiresAt,
  });
}

export async function findActiveSessionByTokenHash(tokenHash: string): Promise<
  | {
      sessionId: string;
      expiresAt: Date;
      user: User;
    }
  | undefined
> {
  const now = new Date();
  const [row] = await getDb()
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      revokedAt: sessions.revokedAt,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);

  if (!row || row.revokedAt || row.expiresAt <= now) {
    return undefined;
  }

  return {sessionId: row.sessionId, expiresAt: row.expiresAt, user: row.user};
}

export async function revokeSessionByTokenHash(tokenHash: string): Promise<void> {
  await getDb()
    .update(sessions)
    .set({revokedAt: new Date()})
    .where(and(eq(sessions.tokenHash, tokenHash), isNull(sessions.revokedAt)));
}

export async function revokeAllSessionsForUser(userId: string): Promise<void> {
  await getDb()
    .update(sessions)
    .set({revokedAt: new Date()})
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

export async function revokeOtherSessionsForUser(
  userId: string,
  keepSessionId: string,
): Promise<void> {
  await getDb()
    .update(sessions)
    .set({revokedAt: new Date()})
    .where(
      and(
        eq(sessions.userId, userId),
        isNull(sessions.revokedAt),
        ne(sessions.id, keepSessionId),
      ),
    );
}

export async function touchSession(sessionId: string): Promise<void> {
  await getDb()
    .update(sessions)
    .set({lastSeenAt: new Date()})
    .where(eq(sessions.id, sessionId));
}

export async function findValidInviteToken(tokenHash: string): Promise<AuthToken | undefined> {
  return findValidAuthToken(tokenHash, "invite");
}

export async function findValidAuthToken(
  tokenHash: string,
  purpose: AuthTokenPurpose,
): Promise<AuthToken | undefined> {
  const now = new Date();
  const [token] = await getDb()
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.tokenHash, tokenHash),
        eq(authTokens.purpose, purpose),
        isNull(authTokens.consumedAt),
        gt(authTokens.expiresAt, now),
      ),
    )
    .limit(1);

  return token;
}

export async function insertAuthToken(input: {
  userId: string;
  purpose: AuthTokenPurpose;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  await getDb()
    .update(authTokens)
    .set({consumedAt: new Date()})
    .where(
      and(
        eq(authTokens.userId, input.userId),
        eq(authTokens.purpose, input.purpose),
        isNull(authTokens.consumedAt),
      ),
    );

  await getDb().insert(authTokens).values({
    userId: input.userId,
    purpose: input.purpose,
    tokenHash: input.tokenHash,
    expiresAt: input.expiresAt,
  });
}

export async function insertInviteToken(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  await insertAuthToken({
    userId: input.userId,
    purpose: "invite",
    tokenHash: input.tokenHash,
    expiresAt: input.expiresAt,
  });
}

export async function markAuthTokenConsumed(tokenId: string): Promise<void> {
  await getDb()
    .update(authTokens)
    .set({consumedAt: new Date()})
    .where(eq(authTokens.id, tokenId));
}

export async function markInviteConsumed(tokenId: string): Promise<void> {
  await markAuthTokenConsumed(tokenId);
}

export async function findAuthTokenByHash(tokenHash: string): Promise<AuthToken | undefined> {
  const [token] = await getDb()
    .select()
    .from(authTokens)
    .where(eq(authTokens.tokenHash, tokenHash))
    .limit(1);
  return token;
}

export async function recordAudit(input: {
  actorUserId?: string | null;
  targetUserId?: string | null;
  action: AuditAction;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}): Promise<void> {
  await getDb().insert(auditEvents).values({
    actorUserId: input.actorUserId ?? null,
    targetUserId: input.targetUserId ?? null,
    action: input.action,
    before: input.before ?? null,
    after: input.after ?? null,
  });
}

export async function listAuditForUser(targetUserId: string) {
  return getDb()
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.targetUserId, targetUserId))
    .orderBy(desc(auditEvents.createdAt));
}

export async function recordAuthAttempt(action: string, subject: string): Promise<void> {
  await getDb().insert(authAttempts).values({action, subject});
}

export async function countAuthAttempts(
  action: string,
  subject: string,
  since: Date,
): Promise<number> {
  const [row] = await getDb()
    .select({value: count()})
    .from(authAttempts)
    .where(
      and(
        eq(authAttempts.action, action),
        eq(authAttempts.subject, subject),
        gt(authAttempts.createdAt, since),
      ),
    );

  return Number(row?.value ?? 0);
}

export {AUDIT_ACTIONS};

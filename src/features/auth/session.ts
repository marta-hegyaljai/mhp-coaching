import {cookies} from "next/headers";

import type {User} from "@/db/schema";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from "@/features/auth/constants";
import {hashToken, randomToken} from "@/features/auth/tokens";
import {
  findActiveSessionByTokenHash,
  insertSession,
  revokeSessionByTokenHash,
  touchSession,
} from "@/features/auth/repository";

function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function cookieDomain(): string | undefined {
  const domain = process.env.SESSION_COOKIE_DOMAIN?.trim();
  return domain || undefined;
}

export async function createSessionCookie(userId: string): Promise<void> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await insertSession({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    domain: cookieDomain(),
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await revokeSessionByTokenHash(hashToken(token));
  }

  jar.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    domain: cookieDomain(),
    expires: new Date(0),
  });
}

export async function readActiveSession(): Promise<{
  sessionId: string;
  user: User;
} | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await findActiveSessionByTokenHash(hashToken(token));

  if (!session) {
    return null;
  }

  await touchSession(session.sessionId).catch(() => undefined);
  return {sessionId: session.sessionId, user: session.user};
}

export async function readSessionUser(): Promise<User | null> {
  const session = await readActiveSession();
  return session?.user ?? null;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await readSessionUser();
  } catch {
    return null;
  }
}

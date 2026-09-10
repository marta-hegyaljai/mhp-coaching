import type {AuthTokenPurpose} from "@/db/schema";
import {
  EMAIL_CHANGE_TTL_MS,
  INVITE_TTL_MS,
  RECOVERY_TTL_MS,
  VERIFY_TTL_MS,
} from "@/features/auth/constants";
import {insertAuthToken} from "@/features/auth/repository";
import {hashToken, randomToken} from "@/features/auth/tokens";

const TTL_BY_PURPOSE: Record<AuthTokenPurpose, number> = {
  invite: INVITE_TTL_MS,
  verify: VERIFY_TTL_MS,
  recovery: RECOVERY_TTL_MS,
  email_change: EMAIL_CHANGE_TTL_MS,
};

export async function issueAuthToken(
  userId: string,
  purpose: AuthTokenPurpose,
  ttlMs = TTL_BY_PURPOSE[purpose],
): Promise<string> {
  const rawToken = randomToken();
  await insertAuthToken({
    userId,
    purpose,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return rawToken;
}

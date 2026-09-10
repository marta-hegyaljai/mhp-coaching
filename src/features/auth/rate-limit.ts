import {headers} from "next/headers";

import {
  countAuthAttempts,
  recordAuthAttempt,
} from "@/features/auth/repository";
import {
  INVITE_ACCEPT_MAX_ATTEMPTS,
  INVITE_ACCEPT_WINDOW_MS,
  RECOVERY_MAX_ATTEMPTS,
  RECOVERY_WINDOW_MS,
  SIGN_IN_MAX_ATTEMPTS,
  SIGN_IN_WINDOW_MS,
  SIGN_UP_MAX_ATTEMPTS,
  SIGN_UP_WINDOW_MS,
  VERIFY_MAX_ATTEMPTS,
  VERIFY_WINDOW_MS,
} from "@/features/auth/constants";

export async function clientIp(): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();

  return first || requestHeaders.get("x-real-ip") || "unknown";
}

async function isEmailAndIpLimited(
  action: string,
  emailNormalized: string,
  windowMs: number,
  maxAttempts: number,
): Promise<boolean> {
  const ip = await clientIp();
  const since = new Date(Date.now() - windowMs);
  const emailCount = await countAuthAttempts(action, `email:${emailNormalized}`, since);
  const ipCount = await countAuthAttempts(action, `ip:${ip}`, since);
  return emailCount >= maxAttempts || ipCount >= maxAttempts;
}

async function recordEmailAndIpAttempt(
  action: string,
  emailNormalized: string,
): Promise<void> {
  const ip = await clientIp();
  await recordAuthAttempt(action, `email:${emailNormalized}`);
  await recordAuthAttempt(action, `ip:${ip}`);
}

export async function isSignInRateLimited(emailNormalized: string): Promise<boolean> {
  return isEmailAndIpLimited(
    "sign_in",
    emailNormalized,
    SIGN_IN_WINDOW_MS,
    SIGN_IN_MAX_ATTEMPTS,
  );
}

export async function recordSignInAttempt(emailNormalized: string): Promise<void> {
  await recordEmailAndIpAttempt("sign_in", emailNormalized);
}

export async function isInviteAcceptRateLimited(): Promise<boolean> {
  const ip = await clientIp();
  const since = new Date(Date.now() - INVITE_ACCEPT_WINDOW_MS);
  const ipCount = await countAuthAttempts("invite_accept", `ip:${ip}`, since);
  return ipCount >= INVITE_ACCEPT_MAX_ATTEMPTS;
}

export async function recordInviteAcceptAttempt(): Promise<void> {
  const ip = await clientIp();
  await recordAuthAttempt("invite_accept", `ip:${ip}`);
}

export async function isSignUpRateLimited(emailNormalized: string): Promise<boolean> {
  return isEmailAndIpLimited(
    "sign_up",
    emailNormalized,
    SIGN_UP_WINDOW_MS,
    SIGN_UP_MAX_ATTEMPTS,
  );
}

export async function recordSignUpAttempt(emailNormalized: string): Promise<void> {
  await recordEmailAndIpAttempt("sign_up", emailNormalized);
}

export async function isRecoveryRateLimited(emailNormalized: string): Promise<boolean> {
  return isEmailAndIpLimited(
    "recovery",
    emailNormalized,
    RECOVERY_WINDOW_MS,
    RECOVERY_MAX_ATTEMPTS,
  );
}

export async function recordRecoveryAttempt(emailNormalized: string): Promise<void> {
  await recordEmailAndIpAttempt("recovery", emailNormalized);
}

export async function isVerifyRateLimited(emailNormalized: string): Promise<boolean> {
  return isEmailAndIpLimited(
    "verify",
    emailNormalized,
    VERIFY_WINDOW_MS,
    VERIFY_MAX_ATTEMPTS,
  );
}

export async function recordVerifyAttempt(emailNormalized: string): Promise<void> {
  await recordEmailAndIpAttempt("verify", emailNormalized);
}

export {SIGN_IN_MAX_ATTEMPTS, SIGN_UP_MAX_ATTEMPTS, RECOVERY_MAX_ATTEMPTS, VERIFY_MAX_ATTEMPTS};

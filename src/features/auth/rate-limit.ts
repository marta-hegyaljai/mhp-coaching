import {headers} from "next/headers";

import {
  countAuthAttempts,
  recordAuthAttempt,
} from "@/features/auth/repository";
import {
  INVITE_ACCEPT_MAX_ATTEMPTS,
  INVITE_ACCEPT_WINDOW_MS,
  SIGN_IN_MAX_ATTEMPTS,
  SIGN_IN_WINDOW_MS,
} from "@/features/auth/constants";

export async function clientIp(): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();

  return first || requestHeaders.get("x-real-ip") || "unknown";
}

export async function isSignInRateLimited(emailNormalized: string): Promise<boolean> {
  const ip = await clientIp();
  const since = new Date(Date.now() - SIGN_IN_WINDOW_MS);
  const emailCount = await countAuthAttempts("sign_in", `email:${emailNormalized}`, since);
  const ipCount = await countAuthAttempts("sign_in", `ip:${ip}`, since);

  return emailCount >= SIGN_IN_MAX_ATTEMPTS || ipCount >= SIGN_IN_MAX_ATTEMPTS;
}

export async function recordSignInAttempt(emailNormalized: string): Promise<void> {
  const ip = await clientIp();
  await recordAuthAttempt("sign_in", `email:${emailNormalized}`);
  await recordAuthAttempt("sign_in", `ip:${ip}`);
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

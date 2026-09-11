import {timingSafeEqual} from "node:crypto";

function readBearer(header: string | null): string | null {
  if (!header) {
    return null;
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

export function authorizeCronRequest(
  request: Request,
  environment: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  const secret = environment.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }

  const provided =
    readBearer(request.headers.get("authorization")) ??
    request.headers.get("x-cron-secret")?.trim() ??
    null;
  if (!provided) {
    return false;
  }

  const expected = Buffer.from(secret);
  const received = Buffer.from(provided);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

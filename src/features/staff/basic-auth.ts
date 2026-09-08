import {NextResponse} from "next/server";

function expectedCredentials(): {user: string; password: string} | undefined {
  const password = process.env.STAFF_PASSWORD;

  if (!password) {
    return undefined;
  }

  return {
    user: process.env.STAFF_USERNAME ?? "staff",
    password,
  };
}

export function isStaffAuthorized(header: string | null): boolean {
  const expected = expectedCredentials();

  if (!expected) {
    return false;
  }

  if (!header?.startsWith("Basic ")) {
    return false;
  }

  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");

    if (separator < 0) {
      return false;
    }

    const user = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    return user === expected.user && password === expected.password;
  } catch {
    return false;
  }
}

export function unauthorizedStaffResponse(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="MHP Staff"',
      "Cache-Control": "no-store",
    },
  });
}

export function isStaffPath(pathname: string): boolean {
  return /(?:^|\/)(?:fr|de|en)\/staff(?:\/|$)/.test(pathname);
}

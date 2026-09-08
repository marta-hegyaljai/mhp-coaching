import createMiddleware from "next-intl/middleware";
import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";

import {isStaffAuthorized, isStaffPath, unauthorizedStaffResponse} from "@/features/staff/basic-auth";
import {routing} from "@/i18n/routing";

const handleI18n = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  if (
    isStaffPath(request.nextUrl.pathname) &&
    !isStaffAuthorized(request.headers.get("authorization"))
  ) {
    return unauthorizedStaffResponse();
  }

  // Next 16 may invoke Proxy again for next-intl's localized-path rewrite.
  // The locale header marks that internal pass; handling it twice would turn
  // `/fr/formations` into a redirect loop between the public and app paths.
  if (request.headers.has("x-next-intl-locale")) {
    return NextResponse.next({request: {headers: request.headers}});
  }

  return handleI18n(request);
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*|.*opengraph-image).*)",
};

import createMiddleware from "next-intl/middleware";
import type {NextRequest} from "next/server";

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

  return handleI18n(request);
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*|.*opengraph-image).*)",
};

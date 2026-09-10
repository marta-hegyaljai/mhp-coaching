import {NextResponse} from "next/server";

import {canAccessStaffLists} from "@/features/auth/policy";
import {readSessionUser} from "@/features/auth/session";

export async function requireAdminApi(): Promise<
  {ok: true} | {ok: false; response: NextResponse}
> {
  const user = await readSessionUser();

  if (!user) {
    return {
      ok: false,
      response: new NextResponse("Authentication required", {
        status: 401,
        headers: {"Cache-Control": "no-store"},
      }),
    };
  }

  if (!canAccessStaffLists(user)) {
    return {
      ok: false,
      response: new NextResponse("Forbidden", {
        status: 403,
        headers: {"Cache-Control": "no-store"},
      }),
    };
  }

  return {ok: true};
}

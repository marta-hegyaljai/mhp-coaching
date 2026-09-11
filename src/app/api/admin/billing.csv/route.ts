import {NextResponse} from "next/server";

import {requireAdminApi} from "@/features/auth/require-api";
import {findUserById} from "@/features/auth/repository";
import {readSessionUser} from "@/features/auth/session";
import {openMonthUserLinesToCsv, openMonthUserTotalsToCsv} from "@/features/rooms/usage-csv";
import {loadOpenMonthUsage, type UserUsage} from "@/features/rooms/usage";
import {assertNoPrivateNoteMaterial} from "@/features/rooms/privacy";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireAdminApi();
  if (!access.ok) {
    return access.response;
  }

  const actor = await readSessionUser();
  if (!actor) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {"Cache-Control": "no-store"},
    });
  }

  const requestedUserId = new URL(request.url).searchParams.get("user") ?? undefined;
  const report = await loadOpenMonthUsage({actor, userId: requestedUserId || undefined});

  let csv: string;
  if (requestedUserId) {
    const existing = report.users[0];
    const owner = existing ?? (await emptyUserUsage(requestedUserId));
    if (!owner) {
      return new NextResponse("Not found", {status: 404, headers: {"Cache-Control": "no-store"}});
    }
    csv = openMonthUserLinesToCsv(report, owner);
  } else {
    csv = openMonthUserTotalsToCsv(report);
  }

  assertNoPrivateNoteMaterial(csv);

  const filename = requestedUserId
    ? `mhp-room-usage-${report.monthKey}-${requestedUserId}.csv`
    : `mhp-room-usage-${report.monthKey}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=${filename}`,
      "Cache-Control": "no-store",
    },
  });
}

async function emptyUserUsage(userId: string): Promise<UserUsage | undefined> {
  const user = await findUserById(userId);
  if (!user) {
    return undefined;
  }
  return {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    currentDiscountPercent: user.roomDiscountPercent,
    billedMinutes: 0,
    billedAmountMinor: 0,
    bookingCount: 0,
    rooms: [],
    lines: [],
  };
}

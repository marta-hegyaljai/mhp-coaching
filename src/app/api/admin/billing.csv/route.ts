import {NextResponse} from "next/server";

import {requireAdminApi} from "@/features/auth/require-api";
import {findUserById} from "@/features/auth/repository";
import {readSessionUser} from "@/features/auth/session";
import {monthUserLinesToCsv, monthUserTotalsToCsv} from "@/features/rooms/usage-csv";
import {emptyUserUsage, loadMonthUsage} from "@/features/rooms/usage";
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

  const url = new URL(request.url);
  const requestedUserId = url.searchParams.get("user") ?? undefined;
  const monthKey = url.searchParams.get("month") ?? undefined;
  const report = await loadMonthUsage({
    actor,
    userId: requestedUserId || undefined,
    month: monthKey || undefined,
  });

  let csv: string;
  if (requestedUserId) {
    const existing = report.users[0];
    const owner = existing ?? (await usageOwner(requestedUserId));
    if (!owner) {
      return new NextResponse("Not found", {status: 404, headers: {"Cache-Control": "no-store"}});
    }
    csv = monthUserLinesToCsv(report, owner);
  } else {
    csv = monthUserTotalsToCsv(report);
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

async function usageOwner(userId: string) {
  const user = await findUserById(userId);
  if (!user) {
    return undefined;
  }
  return emptyUserUsage(user);
}

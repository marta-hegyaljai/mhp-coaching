import {NextResponse} from "next/server";

import {requireAdminApi} from "@/features/auth/require-api";
import {findUserById} from "@/features/auth/repository";
import {readSessionUser} from "@/features/auth/session";
import {monthUserLinesToXlsx, monthUserTotalsToXlsx} from "@/features/rooms/usage-xlsx";
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
  const fromKey = url.searchParams.get("from") ?? undefined;
  const toKey = url.searchParams.get("to") ?? undefined;
  const report = await loadMonthUsage({
    actor,
    userId: requestedUserId || undefined,
    month: monthKey || undefined,
    from: fromKey || undefined,
    to: toKey || undefined,
  });

  let data: Buffer;
  if (requestedUserId) {
    const existing = report.users[0];
    const owner = existing ?? (await usageOwner(requestedUserId));
    if (!owner) {
      return new NextResponse("Not found", {status: 404, headers: {"Cache-Control": "no-store"}});
    }
    data = await monthUserLinesToXlsx(report, owner);
  } else {
    data = await monthUserTotalsToXlsx(report);
  }

  assertNoPrivateNoteMaterial(data.toString("utf8"));

  const filename = requestedUserId
    ? `mhp-room-usage-${report.periodKey}-${requestedUserId}.xlsx`
    : `mhp-room-usage-${report.periodKey}.xlsx`;

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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

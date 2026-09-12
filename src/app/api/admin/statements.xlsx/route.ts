import {NextResponse} from "next/server";

import {requireAdminApi} from "@/features/auth/require-api";
import {findUserById} from "@/features/auth/repository";
import {readSessionUser} from "@/features/auth/session";
import {assertNoPrivateNoteMaterial} from "@/features/rooms/privacy";
import {statementDetailToXlsx, statementsMonthToXlsx} from "@/features/rooms/usage-xlsx";
import {
  loadMonthStatements,
  loadStatementDetail,
} from "@/features/rooms/statements";
import {listStatementsByStatuses} from "@/features/rooms/statement-repository";
import {resolveUsagePeriod, usagePeriodKey} from "@/features/rooms/usage";
import {RoomError} from "@/features/rooms/errors";

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
  const statementId = url.searchParams.get("statement") ?? undefined;
  const monthKey = url.searchParams.get("month") ?? undefined;
  const fromKey = url.searchParams.get("from") ?? undefined;
  const toKey = url.searchParams.get("to") ?? undefined;

  try {
    if (statementId) {
      const detail = await loadStatementDetail({actor, statementId});
      const data = await statementDetailToXlsx(detail);
      assertNoPrivateNoteMaterial(data.toString("utf8"));
      return new NextResponse(new Uint8Array(data), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=mhp-room-statement-${detail.statement.id}.xlsx`,
          "Cache-Control": "no-store",
        },
      });
    }

    const period = resolveUsagePeriod({
      month: monthKey || undefined,
      from: fromKey || undefined,
      to: toKey || undefined,
    });
    const statements = period.from.year === period.to.year && period.from.month === period.to.month
      ? await loadMonthStatements({actor, month: period.from})
      : (await listStatementsByStatuses(
          ["FINALIZED", "PAYMENT_PENDING", "PAID", "PAYMENT_FAILED", "OPEN"],
        )).filter((statement) => inPeriod(statement.year, statement.month, period.from, period.to));
    const rows = [];
    for (const statement of statements) {
      const user = await findUserById(statement.userId);
      if (!user) {
        continue;
      }
      rows.push({
        statement,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    }
    const data = await statementsMonthToXlsx({
      fromKey: usagePeriodKey(period.from, period.from),
      toKey: usagePeriodKey(period.to, period.to),
      rows,
    });
    assertNoPrivateNoteMaterial(data.toString("utf8"));
    const key = usagePeriodKey(period.from, period.to);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=mhp-room-statements-${key}.xlsx`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof RoomError && error.code === "notFound") {
      return new NextResponse("Not found", {status: 404, headers: {"Cache-Control": "no-store"}});
    }
    if (error instanceof RoomError && error.code === "forbidden") {
      return new NextResponse("Forbidden", {status: 403, headers: {"Cache-Control": "no-store"}});
    }
    throw error;
  }
}

function inPeriod(
  year: number,
  month: number,
  from: {year: number; month: number},
  to: {year: number; month: number},
): boolean {
  const index = year * 12 + month;
  return index >= from.year * 12 + from.month && index <= to.year * 12 + to.month;
}

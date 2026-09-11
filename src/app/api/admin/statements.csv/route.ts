import {NextResponse} from "next/server";

import {requireAdminApi} from "@/features/auth/require-api";
import {findUserById} from "@/features/auth/repository";
import {readSessionUser} from "@/features/auth/session";
import {assertNoPrivateNoteMaterial} from "@/features/rooms/privacy";
import {statementDetailToCsv, statementsMonthToCsv} from "@/features/rooms/statement-csv";
import {
  loadMonthStatements,
  loadStatementDetail,
} from "@/features/rooms/statements";
import {resolveUsageMonth} from "@/features/rooms/usage";
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

  try {
    if (statementId) {
      const detail = await loadStatementDetail({actor, statementId});
      const csv = statementDetailToCsv(detail);
      assertNoPrivateNoteMaterial(csv);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=mhp-room-statement-${detail.statement.id}.csv`,
          "Cache-Control": "no-store",
        },
      });
    }

    const month = resolveUsageMonth({month: monthKey || undefined});
    const statements = await loadMonthStatements({actor, month});
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
    const csv = statementsMonthToCsv({
      year: month.year,
      month: month.month,
      rows,
    });
    assertNoPrivateNoteMaterial(csv);
    const key = `${month.year}-${String(month.month).padStart(2, "0")}`;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=mhp-room-statements-${key}.csv`,
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

import {NextResponse} from "next/server";

import {listWaitlistEntries} from "@/features/waitlist/repository";
import {requireAdminApi} from "@/features/auth/require-api";
import {waitlistToCsv} from "@/features/staff/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requireAdminApi();

  if (!access.ok) {
    return access.response;
  }

  const csv = waitlistToCsv(await listWaitlistEntries());

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=mhp-waitlist.csv",
      "Cache-Control": "no-store",
    },
  });
}

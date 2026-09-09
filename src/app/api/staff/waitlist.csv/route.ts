import {NextResponse} from "next/server";

import {listWaitlistEntries} from "@/features/waitlist/repository";
import {waitlistToCsv} from "@/features/staff/csv";
import {
  isStaffAuthorized,
  unauthorizedStaffResponse,
} from "@/features/staff/basic-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isStaffAuthorized(request.headers.get("authorization"))) {
    return unauthorizedStaffResponse();
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

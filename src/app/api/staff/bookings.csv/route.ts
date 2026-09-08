import {NextResponse} from "next/server";

import {listBookings} from "@/features/bookings/repository";
import {bookingsToCsv} from "@/features/staff/csv";
import {
  isStaffAuthorized,
  unauthorizedStaffResponse,
} from "@/features/staff/basic-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isStaffAuthorized(request.headers.get("authorization"))) {
    return unauthorizedStaffResponse();
  }

  const csv = bookingsToCsv(await listBookings());

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=mhp-bookings.csv",
      "Cache-Control": "no-store",
    },
  });
}

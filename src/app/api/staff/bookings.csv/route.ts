import {NextResponse} from "next/server";

import {listBookings} from "@/features/bookings/repository";
import {requireAdminApi} from "@/features/auth/require-api";
import {bookingsToCsv} from "@/features/staff/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requireAdminApi();

  if (!access.ok) {
    return access.response;
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

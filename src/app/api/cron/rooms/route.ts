import {NextResponse} from "next/server";

import {authorizeCronRequest} from "@/lib/cron-auth";
import {runRoomMaintenanceJobs} from "@/features/rooms/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({error: "unauthorized"}, {status: 401});
  }

  try {
    const result = await runRoomMaintenanceJobs();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Room cron job failed", error);
    return NextResponse.json({error: "job_failed"}, {status: 500});
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

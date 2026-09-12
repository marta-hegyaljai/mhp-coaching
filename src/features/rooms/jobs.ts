import {sendOpsAlert} from "@/features/email/ops";
import {recordHeartbeat} from "@/features/ops/heartbeats";
import {closePreviousZurichMonth} from "@/features/rooms/month-close";
import {sendDueRoomReminders} from "@/features/rooms/reminders";

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/\s+/g, " ").slice(0, 500);
  }
  return "job_failed";
}

export async function runRoomMaintenanceJobs(now = new Date()) {
  const ranAt = now.toISOString();
  try {
    const reminders = await sendDueRoomReminders(now);
    const monthClose = await closePreviousZurichMonth(now);
    const result = {
      ranAt,
      ok: true as const,
      reminders,
      monthClose,
    };
    await recordHeartbeat({
      job: "rooms",
      ok: true,
      payload: {
        reminders,
        monthClose,
      },
    });
    return result;
  } catch (error) {
    const message = errorMessage(error);
    console.error("Room cron job failed", error);
    await recordHeartbeat({
      job: "rooms",
      ok: false,
      payload: {ranAt},
      error: message,
    }).catch((heartbeatError) => {
      console.error("Failed to record ops heartbeat", heartbeatError);
    });
    await sendOpsAlert({job: "rooms", ranAt, error: message}).catch((alertError) => {
      console.error("Failed to send ops alert", alertError);
    });
    throw error;
  }
}

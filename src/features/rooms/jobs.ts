import {closePreviousZurichMonth} from "@/features/rooms/month-close";
import {sendDueRoomReminders} from "@/features/rooms/reminders";

export async function runRoomMaintenanceJobs(now = new Date()) {
  const reminders = await sendDueRoomReminders(now);
  const monthClose = await closePreviousZurichMonth(now);
  return {
    ranAt: now.toISOString(),
    reminders,
    monthClose,
  };
}

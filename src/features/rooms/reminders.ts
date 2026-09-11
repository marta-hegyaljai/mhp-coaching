import {notifyRoomBookingReminder} from "@/features/rooms/notifications";
import {getBookingSettings, listUpcomingConfirmedBookings} from "@/features/rooms/repository";

export async function sendDueRoomReminders(now = new Date()): Promise<{considered: number; sent: number}> {
  const settings = await getBookingSettings();
  const noticeMs = Math.max(settings.reminderNoticeHours, 0) * 60 * 60 * 1000;
  const windowEnd = new Date(now.getTime() + noticeMs);
  const due = await listUpcomingConfirmedBookings({
    fromExclusive: now,
    toInclusive: windowEnd,
  });

  let sent = 0;
  for (const row of due) {
    const result = await notifyRoomBookingReminder({user: row.owner, booking: row.booking});
    if (result?.status === "SENT" || result?.status === "SKIPPED") {
      sent += 1;
    }
  }

  return {considered: due.length, sent};
}

import type {User} from "@/db/schema";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {canAdminister} from "@/features/auth/policy";
import {recordAudit} from "@/features/auth/repository";
import {RoomError} from "@/features/rooms/errors";
import {
  getBookingSettings,
  listOpeningIntervals,
  replaceBookingConfiguration,
} from "@/features/rooms/repository";

const INTERVAL_CHOICES = [15, 30, 60] as const;

function requireAdmin(actor: User): void {
  if (!canAdminister(actor)) {
    throw new RoomError("forbidden");
  }
}

function requirePositiveInt(value: number, fallbackCode: RoomError["code"] = "invalidRules"): number {
  if (!Number.isInteger(value) || value < 0 || value > 24 * 365) {
    throw new RoomError(fallbackCode);
  }
  return value;
}

export type OpeningHourInput = {
  weekday: number;
  closed: boolean;
  startMinute: number;
  endMinute: number;
};

export async function saveRoomSettings(input: {
  actor: User;
  cancellationNoticeHours: number;
  bookingIntervalMinutes: number;
  minimumBookingMinutes: number;
  maximumBookingMinutes: number | null;
  maximumAdvanceBookingDays: number | null;
  reminderNoticeHours: number;
  hours: OpeningHourInput[];
}): Promise<void> {
  requireAdmin(input.actor);

  if (!INTERVAL_CHOICES.includes(input.bookingIntervalMinutes as (typeof INTERVAL_CHOICES)[number])) {
    throw new RoomError("invalidRules");
  }

  const minimum = requirePositiveInt(input.minimumBookingMinutes);
  if (minimum < input.bookingIntervalMinutes || minimum % input.bookingIntervalMinutes !== 0) {
    throw new RoomError("invalidRules");
  }

  const maximum =
    input.maximumBookingMinutes === null
      ? null
      : requirePositiveInt(input.maximumBookingMinutes);
  if (maximum !== null && (maximum < minimum || maximum % input.bookingIntervalMinutes !== 0)) {
    throw new RoomError("invalidRules");
  }

  const intervals = normalizeHours(input.hours, input.bookingIntervalMinutes);
  const before = {
    settings: await getBookingSettings(),
    hours: await listOpeningIntervals(),
  };

  const {settings, hours} = await replaceBookingConfiguration({
    settings: {
      cancellationNoticeHours: requirePositiveInt(input.cancellationNoticeHours),
      bookingIntervalMinutes: input.bookingIntervalMinutes,
      minimumBookingMinutes: minimum,
      maximumBookingMinutes: maximum,
      maximumAdvanceBookingDays:
        input.maximumAdvanceBookingDays === null
          ? null
          : requirePositiveInt(input.maximumAdvanceBookingDays),
      reminderNoticeHours: requirePositiveInt(input.reminderNoticeHours),
    },
    intervals,
  });

  await recordAudit({
    actorUserId: input.actor.id,
    action: AUDIT_ACTIONS.ROOM_SETTINGS_UPDATED,
    before: {
      cancellationNoticeHours: before.settings.cancellationNoticeHours,
      bookingIntervalMinutes: before.settings.bookingIntervalMinutes,
      minimumBookingMinutes: before.settings.minimumBookingMinutes,
      maximumBookingMinutes: before.settings.maximumBookingMinutes,
      maximumAdvanceBookingDays: before.settings.maximumAdvanceBookingDays,
      reminderNoticeHours: before.settings.reminderNoticeHours,
      hours: before.hours.map((item) => ({
        weekday: item.weekday,
        startMinute: item.startMinute,
        endMinute: item.endMinute,
      })),
    },
    after: {
      cancellationNoticeHours: settings.cancellationNoticeHours,
      bookingIntervalMinutes: settings.bookingIntervalMinutes,
      minimumBookingMinutes: settings.minimumBookingMinutes,
      maximumBookingMinutes: settings.maximumBookingMinutes,
      maximumAdvanceBookingDays: settings.maximumAdvanceBookingDays,
      reminderNoticeHours: settings.reminderNoticeHours,
      hours: hours.map((item) => ({
        weekday: item.weekday,
        startMinute: item.startMinute,
        endMinute: item.endMinute,
      })),
    },
  });
}

export function normalizeHours(
  hours: OpeningHourInput[],
  intervalMinutes: number,
): Array<{weekday: number; startMinute: number; endMinute: number}> {
  if (hours.length !== 7) {
    throw new RoomError("invalidHours");
  }

  const seen = new Set<number>();
  const intervals: Array<{weekday: number; startMinute: number; endMinute: number}> = [];

  for (const hour of hours) {
    if (!Number.isInteger(hour.weekday) || hour.weekday < 1 || hour.weekday > 7) {
      throw new RoomError("invalidHours");
    }
    if (seen.has(hour.weekday)) {
      throw new RoomError("invalidHours");
    }
    seen.add(hour.weekday);
    if (hour.closed) {
      continue;
    }
    if (
      !Number.isInteger(hour.startMinute) ||
      !Number.isInteger(hour.endMinute) ||
      hour.startMinute < 0 ||
      hour.endMinute > 1440 ||
      hour.endMinute <= hour.startMinute ||
      hour.startMinute % intervalMinutes !== 0 ||
      hour.endMinute % intervalMinutes !== 0
    ) {
      throw new RoomError("invalidHours");
    }
    intervals.push({
      weekday: hour.weekday,
      startMinute: hour.startMinute,
      endMinute: hour.endMinute,
    });
  }

  if (seen.size !== 7) {
    throw new RoomError("invalidHours");
  }

  return intervals;
}

export {getBookingSettings, listOpeningIntervals};

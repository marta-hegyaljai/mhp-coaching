export const BUSINESS_TIMEZONE = "Europe/Zurich";

export type LocalDateTime = {
  date: string;
  time: string;
};

export type LocalInstant =
  | {ok: true; instant: Date}
  | {ok: false; reason: "invalid" | "ambiguous"};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function parseLocalDate(value: string): {year: number; month: number; day: number} {
  if (!DATE_PATTERN.test(value)) {
    throw new Error("invalidDate");
  }
  const [year, month, day] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    throw new Error("invalidDate");
  }
  return {year, month, day};
}

export function formatLocalDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function formatLocalTime(hour: number, minute: number): string {
  return `${pad(hour)}:${pad(minute)}`;
}

export function timeToMinutes(time: string): number {
  if (!TIME_PATTERN.test(time)) {
    throw new Error("invalidTime");
  }
  if (time === "24:00") {
    return 1440;
  }
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export function minutesToTime(total: number): string {
  if (total === 1440) {
    return "24:00";
  }
  if (total < 0 || total >= 1440) {
    throw new Error("invalidTime");
  }
  return formatLocalTime(Math.floor(total / 60), total % 60);
}

export function addLocalDays(date: string, days: number): string {
  const {year, month, day} = parseLocalDate(date);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return formatLocalDate(
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate(),
  );
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export function isoWeekday(date: string): number {
  const {year, month, day} = parseLocalDate(date);
  const utcDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return utcDay === 0 ? 7 : utcDay;
}

export function mondayOf(date: string): string {
  return addLocalDays(date, 1 - isoWeekday(date));
}

export function utcToZurich(instant: Date): {
  date: string;
  time: string;
  weekday: number;
} {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIMEZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).formatToParts(instant);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const date = `${read("year")}-${read("month")}-${read("day")}`;
  const hour = Number(read("hour"));
  const minute = Number(read("minute"));
  return {
    date,
    time: formatLocalTime(hour, minute),
    weekday: isoWeekday(date),
  };
}

export function formatZurichRange(startsAt: Date, endsAt: Date): string {
  const start = utcToZurich(startsAt);
  const end = utcToZurich(endsAt);
  if (start.date === end.date) {
    return `${start.date} ${start.time}–${end.time}`;
  }
  return `${start.date} ${start.time} – ${end.date} ${end.time}`;
}

export function zurichLocalToUtc(date: string, time: string): LocalInstant {
  parseLocalDate(date);
  const minutes = timeToMinutes(time);
  if (minutes === 1440) {
    return zurichLocalToUtc(addLocalDays(date, 1), "00:00");
  }

  const {year, month, day} = parseLocalDate(date);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const wanted = formatLocalTime(hour, minute);

  const unique = new Map<number, Date>();
  for (const offsetMinutes of [60, 120]) {
    const instant = new Date(
      Date.UTC(year, month - 1, day, hour, minute) - offsetMinutes * 60_000,
    );
    const local = utcToZurich(instant);
    if (local.date === date && local.time === wanted) {
      unique.set(instant.getTime(), instant);
    }
  }

  if (unique.size === 0) {
    return {ok: false, reason: "invalid"};
  }
  if (unique.size > 1) {
    return {ok: false, reason: "ambiguous"};
  }

  return {ok: true, instant: [...unique.values()][0]};
}

export function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && startB < endA;
}

export function todayInZurich(now = new Date()): string {
  return utcToZurich(now).date;
}

export function sameZurichDay(start: Date, end: Date): boolean {
  const startLocal = utcToZurich(start);
  const endLocal = utcToZurich(end);
  return startLocal.date === endLocal.date || endLocal.time === "00:00";
}

export function listingTimes(intervalMinutes: number): string[] {
  const step = intervalMinutes > 0 ? intervalMinutes : 30;
  const times: string[] = [];
  for (let minute = 0; minute <= 1440; minute += step) {
    times.push(minutesToTime(minute));
  }
  return times;
}

export type ZurichMonth = {
  year: number;
  month: number;
};

export function zurichMonthOf(instant: Date): ZurichMonth {
  const {year, month} = parseLocalDate(utcToZurich(instant).date);
  return {year, month};
}

export function openZurichMonth(now = new Date()): ZurichMonth {
  return zurichMonthOf(now);
}

/**
 * Half-open Zurich calendar-month bounds as UTC instants.
 * 1 September 2026 00:00 Zurich ≤ t < 1 October 2026 00:00 Zurich.
 */
export function zurichMonthRange(month: ZurichMonth): {start: Date; endExclusive: Date} {
  if (
    !Number.isInteger(month.year) ||
    !Number.isInteger(month.month) ||
    month.month < 1 ||
    month.month > 12
  ) {
    throw new Error("invalidDate");
  }

  const startLocal = zurichLocalToUtc(formatLocalDate(month.year, month.month, 1), "00:00");
  const next =
    month.month === 12
      ? {year: month.year + 1, month: 1}
      : {year: month.year, month: month.month + 1};
  const endLocal = zurichLocalToUtc(formatLocalDate(next.year, next.month, 1), "00:00");

  if (!startLocal.ok || !endLocal.ok) {
    throw new Error("invalidDate");
  }

  return {start: startLocal.instant, endExclusive: endLocal.instant};
}

export function isInZurichMonth(instant: Date, month: ZurichMonth): boolean {
  const {start, endExclusive} = zurichMonthRange(month);
  return instant >= start && instant < endExclusive;
}

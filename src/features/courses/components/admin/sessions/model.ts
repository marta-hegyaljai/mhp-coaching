import type {CourseSessionShow} from "@/features/courses/admin-query";
import type {CourseDate} from "@/features/courses/types";

export type SessionEntry = {
  date: CourseDate;
  enrolments: number;
  /** Seats offered, normalised so broken data never renders a negative count. */
  capacity: number;
  seatsLeft: number;
  dayCount: number;
  /** Last occupied day; a reversed range falls back to the start day. */
  lastDay: string;
  isPast: boolean;
};

export type SessionGroups = {
  upcoming: SessionEntry[];
  past: SessionEntry[];
};

export type SessionSummary = {
  total: number;
  upcoming: number;
  past: number;
  inactive: number;
  enrolments: number;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

export function lastDayOf(date: CourseDate): string {
  return date.endDate && date.endDate > date.startDate ? date.endDate : date.startDate;
}

/**
 * Counts wall-clock days arithmetically instead of walking the range, so an
 * unparseable stored date can never spin a loop or throw while rendering.
 */
export function dayCountOf(date: CourseDate): number {
  const start = utcDayIndex(date.startDate);
  const end = utcDayIndex(lastDayOf(date));

  if (start === null || end === null || end < start) {
    return 1;
  }

  return end - start + 1;
}

function utcDayIndex(isoDate: string): number | null {
  if (!ISO_DATE.test(isoDate)) {
    return null;
  }

  const value = Date.parse(`${isoDate}T00:00:00Z`);
  return Number.isFinite(value) ? Math.round(value / MS_PER_DAY) : null;
}

function normalizeCount(value: number | undefined): number {
  return Number.isFinite(value) && (value as number) > 0 ? Math.floor(value as number) : 0;
}

function toEntry(
  date: CourseDate,
  enrolmentCounts: Readonly<Record<string, number>>,
  today: string,
): SessionEntry {
  const enrolments = normalizeCount(enrolmentCounts[date.id]);
  const capacity = normalizeCount(date.capacity);
  const lastDay = lastDayOf(date);

  return {
    date,
    enrolments,
    capacity,
    seatsLeft: Math.max(0, capacity - enrolments),
    dayCount: dayCountOf(date),
    lastDay,
    isPast: lastDay < today,
  };
}

/**
 * Splits sessions the way an admin reads them: what is still ahead, nearest
 * first, then the archive with the most recent session on top.
 */
export function buildSessionEntries(
  dates: readonly CourseDate[],
  enrolmentCounts: Readonly<Record<string, number>>,
  today: string,
): SessionGroups {
  const entries = dates.map((date) => toEntry(date, enrolmentCounts, today));

  return {
    upcoming: entries
      .filter((entry) => !entry.isPast)
      .sort(byDate(1)),
    past: entries.filter((entry) => entry.isPast).sort(byDate(-1)),
  };
}

// Ties are broken by id so the order never shuffles between two renders.
function byDate(direction: 1 | -1) {
  return (a: SessionEntry, b: SessionEntry) =>
    a.date.startDate === b.date.startDate
      ? a.date.id.localeCompare(b.date.id)
      : direction * a.date.startDate.localeCompare(b.date.startDate);
}

export function summarizeSessions(groups: SessionGroups): SessionSummary {
  const entries = [...groups.upcoming, ...groups.past];

  return {
    total: entries.length,
    upcoming: groups.upcoming.filter((entry) => entry.date.active).length,
    past: groups.past.length,
    inactive: entries.filter((entry) => !entry.date.active).length,
    enrolments: entries.reduce((sum, entry) => sum + entry.enrolments, 0),
  };
}

export function filterSessionGroups(
  groups: SessionGroups,
  show: CourseSessionShow,
): SessionGroups {
  switch (show) {
    case "upcoming":
      return {
        upcoming: groups.upcoming.filter((entry) => entry.date.active),
        past: [],
      };
    case "inactive":
      return {
        upcoming: groups.upcoming.filter((entry) => !entry.date.active),
        past: groups.past.filter((entry) => !entry.date.active),
      };
    case "past":
      return {upcoming: [], past: groups.past};
    default:
      return groups;
  }
}

export function countSessionEntries(groups: SessionGroups): number {
  return groups.upcoming.length + groups.past.length;
}

/** Empty sessions can be removed; anything with a booking stays in history. */
export function sessionCanBeDeleted(entry: Pick<SessionEntry, "enrolments">): boolean {
  return entry.enrolments === 0;
}

/** Fill for the seat meter; oversold sessions clamp to a full bar. */
export function occupancyRatio(enrolments: number, capacity: number): number {
  if (capacity <= 0) {
    return enrolments > 0 ? 1 : 0;
  }

  return Math.min(1, enrolments / capacity);
}

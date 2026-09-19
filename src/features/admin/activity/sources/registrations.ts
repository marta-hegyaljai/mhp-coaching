import {and, asc, desc, gte, lt, ne, or, sql, type SQL} from "drizzle-orm";

import {getDb} from "@/db";
import {bookings, type Booking} from "@/db/schema";
import {enrolmentStatusTone} from "@/features/courses/enrolment-status-labels";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {todayInZurich, zurichDayRange} from "@/features/rooms/timezone";
import type {AppLocale} from "@/i18n/routing";
import {formatDayRange} from "@/shared/format/calendar-date";

import {arrivalWhen} from "../format";
import type {ActivityCopy} from "../labels";
import type {ActivityEntry} from "../types";
import type {ActivityBounds} from "../window";
import {
  countAndList,
  likeNeedle,
  type ActivityChannel,
  type ActivitySourceInput,
} from "./contract";

/**
 * `course_date_start` is a snapshot string, so a row written before the field
 * was validated could hold anything. Only well-formed days take part in the
 * chronological windows; everything else falls back to its arrival time.
 */
const ISO_DAY_SQL = sql`${bookings.courseDateStart} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'`;

/**
 * The Zurich day a registration is ordered by outside Today: the course day
 * when it is readable, the day the row arrived otherwise. Mirrors
 * `anchorOf()` so a page read from the database matches the merged order.
 */
const DAY_KEY_SQL = sql`(CASE
  WHEN ${ISO_DAY_SQL} THEN ${bookings.courseDateStart}::date
  ELSE (${bookings.createdAt} AT TIME ZONE 'Europe/Zurich')::date
END)`;

/**
 * Today mixes two reasons to be listed: the course runs today, or someone
 * signed up today. Each row is ordered by its own reason, which is also the
 * moment shown in the list.
 */
function todayKeySql(bounds: ActivityBounds): SQL {
  return sql`(CASE
    WHEN ${ISO_DAY_SQL} AND ${bookings.courseDateStart} = ${bounds.today}
      THEN ${bounds.dayStart}
    ELSE ${bookings.createdAt}
  END)`;
}

function scheduledDay(booking: Booking): string | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(booking.courseDateStart)
    ? booking.courseDateStart
    : null;
}

function where(
  bounds: ActivityBounds,
  q: string,
  includeCancelled: boolean,
): SQL | undefined {
  const filters: Array<SQL | undefined> = [];

  if (!includeCancelled) {
    filters.push(ne(bookings.status, "CANCELLED"));
  }

  if (bounds.when === "today") {
    filters.push(
      or(
        and(ISO_DAY_SQL, sql`${bookings.courseDateStart} = ${bounds.today}`),
        and(
          gte(bookings.createdAt, bounds.dayStart),
          lt(bookings.createdAt, bounds.dayEndExclusive),
        ),
      ),
    );
  } else if (bounds.when === "upcoming") {
    filters.push(and(ISO_DAY_SQL, sql`${bookings.courseDateStart} >= ${bounds.today}`));
  } else {
    filters.push(
      or(
        sql`NOT (${ISO_DAY_SQL})`,
        sql`${bookings.courseDateStart} < ${bounds.today}`,
      ),
    );
  }

  if (q) {
    const needle = likeNeedle(q);
    filters.push(sql`(
      ${bookings.firstName} ILIKE ${needle}
      OR ${bookings.lastName} ILIKE ${needle}
      OR ${bookings.email} ILIKE ${needle}
      OR ${bookings.phone} ILIKE ${needle}
      OR ${bookings.courseTitle} ILIKE ${needle}
    )`);
  }

  const present = filters.filter((filter): filter is SQL => Boolean(filter));
  return present.length > 0 ? and(...present) : undefined;
}

/** Zurich midnight of the course day, so ordering matches the clock times. */
function dayStart(day: string, fallback: Date): Date {
  try {
    return zurichDayRange(day).start;
  } catch {
    return fallback;
  }
}

/**
 * What the row is about, which is both the moment it sorts on and the moment
 * it shows: the course dates, or the signup itself when the course is not what
 * puts the row in this window.
 */
function anchorOf(
  booking: Booking,
  bounds: ActivityBounds,
  locale: AppLocale,
): Pick<ActivityEntry, "occursAt" | "scheduled" | "when"> {
  const day = scheduledDay(booking);

  if (bounds.when === "today" && day !== bounds.today) {
    return {
      occursAt: booking.createdAt,
      scheduled: false,
      when: arrivalWhen(booking.createdAt, locale),
    };
  }

  const anchorDay = day ?? todayInZurich(booking.createdAt);
  return {
    occursAt: dayStart(anchorDay, booking.createdAt),
    scheduled: day !== null,
    when: {
      dateLabel: day
        ? formatDayRange(day, booking.courseDateEnd ?? day, locale)
        : formatDayRange(anchorDay, anchorDay, locale),
      timeLabel: null,
    },
  };
}

function toEntry(
  booking: Booking,
  bounds: ActivityBounds,
  locale: AppLocale,
  copy: ActivityCopy,
): ActivityEntry {
  const person = `${booking.firstName} ${booking.lastName}`.trim();
  const amount = formatChf(minorUnitsToFrancs(booking.amountMinor), locale);

  return {
    id: `registration:${booking.id}`,
    kind: "registration",
    ...anchorOf(booking, bounds, locale),
    receivedAt: booking.createdAt,
    person: person || booking.email,
    personDetail: booking.email,
    title: booking.courseTitle,
    detail: [booking.location, amount].filter(Boolean).join(" · "),
    status: {
      label: copy.registrationStatus(booking.status),
      tone: enrolmentStatusTone(booking.status),
    },
    href: {
      pathname: "/admin/courses/[id]",
      params: {id: booking.courseId},
      query: {tab: "enrolments", q: booking.email},
    },
    source: {kind: "registration", bookingId: booking.id},
  };
}

export const registrationChannel: ActivityChannel = {
  kind: "registration",
  async load({bounds, q, limit, locale, copy, includeCancelled}: ActivitySourceInput) {
    const db = getDb();
    const filter = where(bounds, q, includeCancelled);
    const ascending = bounds.when !== "history";

    const {total, rows} = await countAndList({
      limit,
      count: async () => {
        const [row] = await db
          .select({total: sql<number>`count(*)::int`})
          .from(bookings)
          .where(filter);
        return row?.total ?? 0;
      },
      rows: (take) =>
        db
          .select()
          .from(bookings)
          .where(filter)
          .orderBy(
            ...(bounds.when === "today"
              ? [sql`${todayKeySql(bounds)} ASC`, asc(bookings.createdAt)]
              : ascending
                ? [sql`${DAY_KEY_SQL} ASC`, asc(bookings.createdAt)]
                : [sql`${DAY_KEY_SQL} DESC`, desc(bookings.createdAt)]),
            asc(bookings.id),
          )
          .limit(take),
    });

    return {total, entries: rows.map((row) => toEntry(row, bounds, locale, copy))};
  },
};

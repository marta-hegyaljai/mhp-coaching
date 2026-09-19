import {and, asc, desc, eq, gte, lt, or, sql, type SQL} from "drizzle-orm";

import {getDb} from "@/db";
import {courseCalls, type CourseCall} from "@/db/schema";
import {callPersonName, callWhen} from "@/features/course-calls/format";
import type {AppLocale} from "@/i18n/routing";

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

function runsToday(bounds: ActivityBounds): SQL {
  return and(
    gte(courseCalls.startsAt, bounds.dayStart),
    lt(courseCalls.startsAt, bounds.dayEndExclusive),
  ) as SQL;
}

function where(
  bounds: ActivityBounds,
  q: string,
  includeCancelled: boolean,
): SQL | undefined {
  const filters: Array<SQL | undefined> = [];

  if (!includeCancelled) {
    filters.push(eq(courseCalls.status, "SCHEDULED"));
  }

  if (bounds.when === "today") {
    filters.push(
      or(
        runsToday(bounds),
        and(
          gte(courseCalls.createdAt, bounds.dayStart),
          lt(courseCalls.createdAt, bounds.dayEndExclusive),
        ),
      ),
    );
  } else if (bounds.when === "upcoming") {
    filters.push(gte(courseCalls.startsAt, bounds.now));
  } else {
    filters.push(lt(courseCalls.startsAt, bounds.now));
  }

  if (q) {
    const needle = likeNeedle(q);
    filters.push(sql`(
      ${courseCalls.firstName} ILIKE ${needle}
      OR ${courseCalls.lastName} ILIKE ${needle}
      OR ${courseCalls.email} ILIKE ${needle}
      OR ${courseCalls.phone} ILIKE ${needle}
      OR COALESCE(${courseCalls.courseTitle}, '') ILIKE ${needle}
    )`);
  }

  const present = filters.filter((filter): filter is SQL => Boolean(filter));
  return present.length > 0 ? and(...present) : undefined;
}

/**
 * Today holds calls that happen today and calls booked today. Each is ordered
 * by its own reason, which is also the moment the row shows.
 */
function anchorOf(
  call: CourseCall,
  bounds: ActivityBounds,
  locale: AppLocale,
): Pick<ActivityEntry, "occursAt" | "scheduled" | "when"> {
  const startsToday =
    call.startsAt >= bounds.dayStart && call.startsAt < bounds.dayEndExclusive;

  if (bounds.when === "today" && !startsToday) {
    return {
      occursAt: call.createdAt,
      scheduled: false,
      when: arrivalWhen(call.createdAt, locale),
    };
  }

  const when = callWhen(call.startsAt, call.endsAt, locale);
  return {
    occursAt: call.startsAt,
    scheduled: true,
    when: {dateLabel: when.dateLabel, timeLabel: when.timeLabel},
  };
}

function toEntry(
  call: CourseCall,
  bounds: ActivityBounds,
  locale: AppLocale,
  copy: ActivityCopy,
): ActivityEntry {
  const person = callPersonName(call.firstName, call.lastName);

  return {
    id: `call:${call.id}`,
    kind: "call",
    ...anchorOf(call, bounds, locale),
    receivedAt: call.createdAt,
    person: person || call.email,
    personDetail: call.email,
    title: call.courseTitle ?? copy.noCourse,
    detail: call.phone || null,
    status: {
      label: copy.callStatus(call.status),
      tone: call.status === "SCHEDULED" ? "ok" : "stop",
    },
    href: {pathname: "/admin/calls/[id]", params: {id: call.id}},
    source: {kind: "call", callId: call.id},
  };
}

export const callChannel: ActivityChannel = {
  kind: "call",
  async load({bounds, q, limit, locale, copy, includeCancelled}: ActivitySourceInput) {
    const db = getDb();
    const filter = where(bounds, q, includeCancelled);
    const ascending = bounds.when !== "history";

    const {total, rows} = await countAndList({
      limit,
      count: async () => {
        const [row] = await db
          .select({total: sql<number>`count(*)::int`})
          .from(courseCalls)
          .where(filter);
        return row?.total ?? 0;
      },
      rows: (take) =>
        db
          .select()
          .from(courseCalls)
          .where(filter)
          .orderBy(
            ...(bounds.when === "today"
              ? [
                  sql`(CASE WHEN ${runsToday(bounds)} THEN ${courseCalls.startsAt} ELSE ${courseCalls.createdAt} END) ASC`,
                  asc(courseCalls.createdAt),
                ]
              : ascending
                ? [asc(courseCalls.startsAt), asc(courseCalls.createdAt)]
                : [desc(courseCalls.startsAt), desc(courseCalls.createdAt)]),
            asc(courseCalls.id),
          )
          .limit(take),
    });

    return {total, entries: rows.map((row) => toEntry(row, bounds, locale, copy))};
  },
};

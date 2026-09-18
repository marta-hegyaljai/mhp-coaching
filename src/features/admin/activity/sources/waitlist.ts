import {and, asc, desc, gte, lt, sql, type SQL} from "drizzle-orm";

import {getDb} from "@/db";
import {waitlistEntries, type WaitlistEntry} from "@/db/schema";
import type {AppLocale} from "@/i18n/routing";

import {arrivalWhen} from "../format";
import type {ActivityCopy} from "../labels";
import type {ActivityEntry} from "../types";
import type {ActivityBounds} from "../window";
import {
  countAndList,
  EMPTY_RESULT,
  likeNeedle,
  type ActivityChannel,
  type ActivitySourceInput,
} from "./contract";

function where(bounds: ActivityBounds, q: string): SQL | undefined {
  const filters: Array<SQL | undefined> = [];

  if (bounds.when === "today") {
    filters.push(
      and(
        gte(waitlistEntries.createdAt, bounds.dayStart),
        lt(waitlistEntries.createdAt, bounds.dayEndExclusive),
      ),
    );
  }

  if (q) {
    const needle = likeNeedle(q);
    filters.push(sql`(
      ${waitlistEntries.firstName} ILIKE ${needle}
      OR ${waitlistEntries.lastName} ILIKE ${needle}
      OR ${waitlistEntries.email} ILIKE ${needle}
      OR ${waitlistEntries.phone} ILIKE ${needle}
      OR ${waitlistEntries.courseTitle} ILIKE ${needle}
    )`);
  }

  const present = filters.filter((filter): filter is SQL => Boolean(filter));
  return present.length > 0 ? and(...present) : undefined;
}

function toEntry(
  entry: WaitlistEntry,
  locale: AppLocale,
  copy: ActivityCopy,
): ActivityEntry {
  const notified = entry.notifiedAt !== null;
  const person = `${entry.firstName} ${entry.lastName}`.trim();

  return {
    id: `waitlist:${entry.id}`,
    kind: "waitlist",
    occursAt: entry.createdAt,
    receivedAt: entry.createdAt,
    scheduled: false,
    when: arrivalWhen(entry.createdAt, locale),
    person: person || entry.email,
    personDetail: entry.email,
    title: entry.courseTitle,
    detail: entry.phone || null,
    status: {
      label: copy.waitlistStatus(notified),
      tone: notified ? "ok" : "gold",
    },
    href: {
      pathname: "/admin/courses/[id]",
      params: {id: entry.courseId},
      query: {tab: "waitlist"},
    },
    source: {
      kind: "waitlist",
      entryId: entry.id,
      courseId: entry.courseId,
      notified,
    },
  };
}

export const waitlistChannel: ActivityChannel = {
  kind: "waitlist",
  async load({bounds, q, limit, locale, copy}: ActivitySourceInput) {
    // Joining a waiting list is an arrival, never a planned moment.
    if (bounds.when === "upcoming") {
      return EMPTY_RESULT;
    }

    const db = getDb();
    const filter = where(bounds, q);
    const ascending = bounds.when !== "history";

    const {total, rows} = await countAndList({
      limit,
      count: async () => {
        const [row] = await db
          .select({total: sql<number>`count(*)::int`})
          .from(waitlistEntries)
          .where(filter);
        return row?.total ?? 0;
      },
      rows: (take) =>
        db
          .select()
          .from(waitlistEntries)
          .where(filter)
          .orderBy(
            ascending
              ? asc(waitlistEntries.createdAt)
              : desc(waitlistEntries.createdAt),
            asc(waitlistEntries.id),
          )
          .limit(take),
    });

    return {total, entries: rows.map((row) => toEntry(row, locale, copy))};
  },
};

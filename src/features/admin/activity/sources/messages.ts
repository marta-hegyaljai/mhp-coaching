import {and, asc, desc, gte, lt, sql, type SQL} from "drizzle-orm";

import {getDb} from "@/db";
import {courseInquiries, inquiries, type CourseInquiry, type Inquiry} from "@/db/schema";
import {callPersonName} from "@/features/course-calls/format";
import type {AppLocale} from "@/i18n/routing";

import {arrivalWhen, excerpt} from "../format";
import type {ActivityCopy} from "../labels";
import type {ActivityEntry} from "../types";
import {compareActivityEntries, type ActivityBounds} from "../window";
import {
  countAndList,
  EMPTY_RESULT,
  likeNeedle,
  type ActivityChannel,
  type ActivitySourceInput,
} from "./contract";

/** Contact-form rows store a free `kind`; anything unexpected reads as general. */
function contactTopic(kind: string): "general" | "payment" {
  return kind === "payment" ? "payment" : "general";
}

function arrivalWindow(
  bounds: ActivityBounds,
  column: typeof courseInquiries.createdAt | typeof inquiries.createdAt,
): SQL | undefined {
  if (bounds.when !== "today") {
    return undefined;
  }

  return and(gte(column, bounds.dayStart), lt(column, bounds.dayEndExclusive));
}

function combine(filters: Array<SQL | undefined>): SQL | undefined {
  const present = filters.filter((filter): filter is SQL => Boolean(filter));
  return present.length > 0 ? and(...present) : undefined;
}

function courseWhere(bounds: ActivityBounds, q: string): SQL | undefined {
  const needle = q ? likeNeedle(q) : null;

  return combine([
    arrivalWindow(bounds, courseInquiries.createdAt),
    needle
      ? sql`(
          ${courseInquiries.firstName} ILIKE ${needle}
          OR ${courseInquiries.lastName} ILIKE ${needle}
          OR ${courseInquiries.email} ILIKE ${needle}
          OR ${courseInquiries.phone} ILIKE ${needle}
          OR ${courseInquiries.message} ILIKE ${needle}
          OR COALESCE(${courseInquiries.courseTitle}, '') ILIKE ${needle}
        )`
      : undefined,
  ]);
}

function contactWhere(bounds: ActivityBounds, q: string): SQL | undefined {
  const needle = q ? likeNeedle(q) : null;

  return combine([
    arrivalWindow(bounds, inquiries.createdAt),
    needle
      ? sql`(
          ${inquiries.name} ILIKE ${needle}
          OR ${inquiries.email} ILIKE ${needle}
          OR COALESCE(${inquiries.phone}, '') ILIKE ${needle}
          OR ${inquiries.message} ILIKE ${needle}
          OR COALESCE(${inquiries.courseTitle}, '') ILIKE ${needle}
        )`
      : undefined,
  ]);
}

function fromCourseInquiry(
  row: CourseInquiry,
  locale: AppLocale,
  copy: ActivityCopy,
): ActivityEntry {
  const person = callPersonName(row.firstName, row.lastName);

  return {
    id: `message:course:${row.id}`,
    kind: "message",
    occursAt: row.createdAt,
    receivedAt: row.createdAt,
    scheduled: false,
    when: arrivalWhen(row.createdAt, locale),
    person: person || row.email,
    personDetail: row.email,
    title: row.courseTitle ?? copy.noCourse,
    detail: excerpt(row.message),
    status: {label: copy.messageTopic("course"), tone: "muted"},
    href: {pathname: "/admin/calls/messages/[id]", params: {id: row.id}},
    source: {kind: "message", messageId: row.id, channel: "course"},
  };
}

function fromContactInquiry(
  row: Inquiry,
  locale: AppLocale,
  copy: ActivityCopy,
): ActivityEntry {
  const topic = contactTopic(row.kind);

  return {
    id: `message:contact:${row.id}`,
    kind: "message",
    occursAt: row.createdAt,
    receivedAt: row.createdAt,
    scheduled: false,
    when: arrivalWhen(row.createdAt, locale),
    person: row.name.trim() || row.email,
    personDetail: row.email,
    title: row.courseTitle ?? copy.noCourse,
    detail: excerpt(row.message),
    status: {label: copy.messageTopic(topic), tone: "muted"},
    href: {
      pathname: "/admin/calls/messages/[id]",
      params: {id: row.id},
      query: {channel: "contact"},
    },
    source: {kind: "message", messageId: row.id, channel: "contact"},
  };
}

/**
 * Written course questions and contact/payment-help messages are one inbox for
 * the admin even though they live in separate tables, so the channel merges
 * them before the panel ever sees a row.
 */
export const messageChannel: ActivityChannel = {
  kind: "message",
  async load({bounds, q, limit, locale, copy}: ActivitySourceInput) {
    // A message only ever arrives; it has nothing scheduled ahead.
    if (bounds.when === "upcoming") {
      return EMPTY_RESULT;
    }

    const db = getDb();
    const courseFilter = courseWhere(bounds, q);
    const contactFilter = contactWhere(bounds, q);
    const ascending = bounds.when !== "history";

    const [course, contact] = await Promise.all([
      countAndList({
        limit,
        count: async () => {
          const [row] = await db
            .select({total: sql<number>`count(*)::int`})
            .from(courseInquiries)
            .where(courseFilter);
          return row?.total ?? 0;
        },
        rows: (take) =>
          db
            .select()
            .from(courseInquiries)
            .where(courseFilter)
            .orderBy(
              ascending
                ? asc(courseInquiries.createdAt)
                : desc(courseInquiries.createdAt),
              asc(courseInquiries.id),
            )
            .limit(take),
      }),
      countAndList({
        limit,
        count: async () => {
          const [row] = await db
            .select({total: sql<number>`count(*)::int`})
            .from(inquiries)
            .where(contactFilter);
          return row?.total ?? 0;
        },
        rows: (take) =>
          db
            .select()
            .from(inquiries)
            .where(contactFilter)
            .orderBy(
              ascending ? asc(inquiries.createdAt) : desc(inquiries.createdAt),
              asc(inquiries.id),
            )
            .limit(take),
      }),
    ]);

    const entries = [
      ...course.rows.map((row) => fromCourseInquiry(row, locale, copy)),
      ...contact.rows.map((row) => fromContactInquiry(row, locale, copy)),
    ]
      .sort(compareActivityEntries(bounds.when))
      .slice(0, limit);

    return {entries, total: course.total + contact.total};
  },
};

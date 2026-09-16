import {and, asc, desc, eq, gte, lt, sql, type SQL} from "drizzle-orm";
import {alias} from "drizzle-orm/pg-core";

import {getDb} from "@/db";
import {auditEvents, users} from "@/db/schema";
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

const actor = alias(users, "change_actor");
const target = alias(users, "change_target");

type ChangeRow = {
  id: string;
  createdAt: Date;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  targetId: string | null;
  targetFirstName: string | null;
  targetLastName: string | null;
  targetEmail: string | null;
  actorFirstName: string | null;
  actorLastName: string | null;
};

function fullName(first: string | null, last: string | null): string | null {
  const name = `${first ?? ""} ${last ?? ""}`.trim();
  return name || null;
}

/**
 * Some events are about a person who has no account — a waiting-list contact or
 * an advice-call guest. Those record the address in the snapshot instead.
 */
function snapshotEmail(row: ChangeRow): string | null {
  for (const snapshot of [row.after, row.before]) {
    const value = snapshot?.email;
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function where(bounds: ActivityBounds, q: string): SQL | undefined {
  const filters: Array<SQL | undefined> = [];

  if (bounds.when === "today") {
    filters.push(
      and(
        gte(auditEvents.createdAt, bounds.dayStart),
        lt(auditEvents.createdAt, bounds.dayEndExclusive),
      ),
    );
  }

  if (q) {
    const needle = likeNeedle(q);
    filters.push(sql`(
      ${auditEvents.action} ILIKE ${needle}
      OR COALESCE(${target.firstName}, '') ILIKE ${needle}
      OR COALESCE(${target.lastName}, '') ILIKE ${needle}
      OR COALESCE(${target.email}, '') ILIKE ${needle}
      OR COALESCE(${actor.firstName}, '') ILIKE ${needle}
      OR COALESCE(${actor.lastName}, '') ILIKE ${needle}
      OR COALESCE(${auditEvents.after} ->> 'email', '') ILIKE ${needle}
      OR COALESCE(${auditEvents.before} ->> 'email', '') ILIKE ${needle}
    )`);
  }

  const present = filters.filter((filter): filter is SQL => Boolean(filter));
  return present.length > 0 ? and(...present) : undefined;
}

function toEntry(row: ChangeRow, locale: AppLocale, copy: ActivityCopy): ActivityEntry {
  const targetName = fullName(row.targetFirstName, row.targetLastName);
  const payloadEmail = snapshotEmail(row);
  const actorName = fullName(row.actorFirstName, row.actorLastName);

  return {
    id: `change:${row.id}`,
    kind: "change",
    occursAt: row.createdAt,
    receivedAt: row.createdAt,
    scheduled: false,
    when: arrivalWhen(row.createdAt, locale),
    person: targetName ?? row.targetEmail ?? payloadEmail,
    personDetail: row.targetEmail ?? payloadEmail,
    title: copy.auditAction(row.action),
    detail: copy.actorLine(actorName ?? copy.systemActor),
    status: null,
    href: row.targetId
      ? {pathname: "/admin/users/[id]", params: {id: row.targetId}}
      : null,
    source: {kind: "change", eventId: row.id},
  };
}

/**
 * The append-only account and access log: who was invited, disabled, granted
 * access, marked notified on a waiting list or removed from one.
 */
export const changeChannel: ActivityChannel = {
  kind: "change",
  async load({bounds, q, limit, locale, copy}: ActivitySourceInput) {
    // A recorded change already happened; nothing about it lies ahead.
    if (bounds.when === "upcoming") {
      return EMPTY_RESULT;
    }

    const db = getDb();
    const filter = where(bounds, q);
    const ascending = bounds.when !== "history";
    const joined = () =>
      db
        .select({
          id: auditEvents.id,
          createdAt: auditEvents.createdAt,
          action: auditEvents.action,
          before: auditEvents.before,
          after: auditEvents.after,
          targetId: target.id,
          targetFirstName: target.firstName,
          targetLastName: target.lastName,
          targetEmail: target.email,
          actorFirstName: actor.firstName,
          actorLastName: actor.lastName,
        })
        .from(auditEvents)
        .leftJoin(target, eq(auditEvents.targetUserId, target.id))
        .leftJoin(actor, eq(auditEvents.actorUserId, actor.id));

    const {total, rows} = await countAndList<ChangeRow>({
      limit,
      count: async () => {
        const [row] = await db
          .select({total: sql<number>`count(*)::int`})
          .from(auditEvents)
          .leftJoin(target, eq(auditEvents.targetUserId, target.id))
          .leftJoin(actor, eq(auditEvents.actorUserId, actor.id))
          .where(filter);
        return row?.total ?? 0;
      },
      rows: (take) =>
        joined()
          .where(filter)
          .orderBy(
            ...(ascending
              ? [asc(auditEvents.createdAt)]
              : [desc(auditEvents.createdAt)]),
            asc(auditEvents.id),
          )
          .limit(take),
    });

    return {total, entries: rows.map((row) => toEntry(row, locale, copy))};
  },
};

import {and, asc, desc, eq, gt, gte, lt, or, sql, type SQL} from "drizzle-orm";

import {getDb} from "@/db";
import {roomBookings, users, type RoomBooking} from "@/db/schema";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {chargeableAmountMinor} from "@/features/rooms/billing";
import {bookingWhen} from "@/features/rooms/format";
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

type ReservationRow = {
  booking: RoomBooking;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
};

/** A reservation belongs to today when it overlaps the Zurich day at all. */
function runsToday(bounds: ActivityBounds): SQL {
  return and(
    lt(roomBookings.startsAt, bounds.dayEndExclusive),
    gt(roomBookings.endsAt, bounds.dayStart),
  ) as SQL;
}

function where(bounds: ActivityBounds, q: string): SQL | undefined {
  const filters: Array<SQL | undefined> = [];

  if (bounds.when === "today") {
    filters.push(
      or(
        runsToday(bounds),
        and(
          gte(roomBookings.createdAt, bounds.dayStart),
          lt(roomBookings.createdAt, bounds.dayEndExclusive),
        ),
      ),
    );
  } else if (bounds.when === "upcoming") {
    filters.push(gte(roomBookings.startsAt, bounds.now));
  } else {
    filters.push(lt(roomBookings.startsAt, bounds.now));
  }

  if (q) {
    const needle = likeNeedle(q);
    filters.push(sql`(
      ${users.firstName} ILIKE ${needle}
      OR ${users.lastName} ILIKE ${needle}
      OR ${users.email} ILIKE ${needle}
      OR ${roomBookings.roomName} ILIKE ${needle}
    )`);
  }

  const present = filters.filter((filter): filter is SQL => Boolean(filter));
  return present.length > 0 ? and(...present) : undefined;
}

/**
 * Today holds reservations that run today and reservations booked today. Each
 * is ordered by its own reason, which is also the moment the row shows.
 */
function anchorOf(
  booking: RoomBooking,
  bounds: ActivityBounds,
  locale: AppLocale,
): Pick<ActivityEntry, "occursAt" | "scheduled" | "when"> {
  const overlapsToday =
    booking.startsAt < bounds.dayEndExclusive && booking.endsAt > bounds.dayStart;

  if (bounds.when === "today" && !overlapsToday) {
    return {
      occursAt: booking.createdAt,
      scheduled: false,
      when: arrivalWhen(booking.createdAt, locale),
    };
  }

  const when = bookingWhen(booking.startsAt, booking.endsAt, locale, {
    weekday: false,
  });
  return {
    occursAt: booking.startsAt,
    scheduled: true,
    when: {dateLabel: when.dateLabel, timeLabel: when.timeLabel},
  };
}

function toEntry(
  row: ReservationRow,
  bounds: ActivityBounds,
  locale: AppLocale,
  copy: ActivityCopy,
): ActivityEntry {
  const chargeable = chargeableAmountMinor(row.booking);
  const owner = `${row.ownerFirstName} ${row.ownerLastName}`.trim();

  return {
    id: `reservation:${row.booking.id}`,
    kind: "reservation",
    ...anchorOf(row.booking, bounds, locale),
    receivedAt: row.booking.createdAt,
    person: owner || row.ownerEmail,
    personDetail: row.ownerEmail,
    title: row.booking.roomName,
    detail: formatChf(minorUnitsToFrancs(chargeable), locale),
    status: {
      label: copy.reservationStatus(row.booking.status),
      tone: row.booking.status === "CONFIRMED" ? "strong" : "muted",
    },
    href: {pathname: "/admin/bookings/[id]", params: {id: row.booking.id}},
    source: {kind: "reservation", bookingId: row.booking.id},
  };
}

export const reservationChannel: ActivityChannel = {
  kind: "reservation",
  async load({bounds, q, limit, locale, copy}: ActivitySourceInput) {
    const db = getDb();
    const filter = where(bounds, q);
    const ascending = bounds.when !== "history";

    const {total, rows} = await countAndList<ReservationRow>({
      limit,
      count: async () => {
        const [row] = await db
          .select({total: sql<number>`count(*)::int`})
          .from(roomBookings)
          .innerJoin(users, eq(roomBookings.userId, users.id))
          .where(filter);
        return row?.total ?? 0;
      },
      rows: (take) =>
        db
          .select({
            booking: roomBookings,
            ownerFirstName: users.firstName,
            ownerLastName: users.lastName,
            ownerEmail: users.email,
          })
          .from(roomBookings)
          .innerJoin(users, eq(roomBookings.userId, users.id))
          .where(filter)
          .orderBy(
            ...(bounds.when === "today"
              ? [
                  sql`(CASE WHEN ${runsToday(bounds)} THEN ${roomBookings.startsAt} ELSE ${roomBookings.createdAt} END) ASC`,
                  asc(roomBookings.createdAt),
                ]
              : ascending
                ? [asc(roomBookings.startsAt), asc(roomBookings.createdAt)]
                : [desc(roomBookings.startsAt), desc(roomBookings.createdAt)]),
            asc(roomBookings.id),
          )
          .limit(take),
    });

    return {total, entries: rows.map((row) => toEntry(row, bounds, locale, copy))};
  },
};

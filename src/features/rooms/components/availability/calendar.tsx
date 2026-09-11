import {getTranslations} from "next-intl/server";

import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import type {AvailabilityRoom, TherapistAvailability} from "@/features/rooms/availability";
import {bookHref} from "@/features/rooms/book-query";
import {availabilityHref, type AvailabilityQuery} from "@/features/rooms/query";
import {addLocalDays, todayInZurich} from "@/features/rooms/timezone";
import type {PathnameHref} from "@/i18n/href";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {
  formatDayHeading,
  formatDayRange,
  formatWeekdayDate,
} from "@/shared/format/calendar-date";

import {DayStrip} from "./day-strip";
import {AvailabilityGrid, type GridColumn} from "./grid";
import {AvailabilityLegend} from "./legend";
import {RoomFilter} from "./room-filter";
import {buildColumnCells} from "./runs";
import {indexSlots, type SlotIndex} from "./slot-index";
import type {SlotLabels} from "./slot-styles";
import {AvailabilityToolbar} from "./toolbar";

/** Bounded so a malformed range can never spin the renderer. */
const MAX_DAYS = 31;

function listDays(startDate: string, endDate: string): string[] {
  const days: string[] = [];

  for (
    let cursor = startDate;
    cursor <= endDate && days.length < MAX_DAYS;
    cursor = addLocalDays(cursor, 1)
  ) {
    days.push(cursor);
  }

  return days.length > 0 ? days : [startDate];
}

export async function AvailabilityCalendar({
  locale,
  query,
  availability,
}: {
  locale: AppLocale;
  query: AvailabilityQuery;
  availability: TherapistAvailability;
}) {
  const t = await getTranslations("Rooms");
  const labels: SlotLabels = {
    available: t("available"),
    booked: t("booked"),
    unavailable: t("unavailable"),
    "my-booking": t("myBooking"),
  };
  const today = todayInZurich();
  const index = indexSlots(availability.slots);
  const days = listDays(availability.startDate, availability.endDate);
  const isWeek = query.view === "week";

  // A stale or unknown `room` filter empties the payload; offer a way back
  // instead of claiming the whole inventory is missing.
  if (availability.rooms.length === 0 || index.times.length === 0) {
    return (
      <EmptyState
        message={query.roomId ? t("filteredRoomMissing") : t("emptyInventory")}
        action={
          query.roomId
            ? {href: availabilityHref({...query, roomId: undefined}), label: t("allRooms")}
            : undefined
        }
      />
    );
  }

  // Week columns are days, so a week can only ever show one room.
  const weekRoom =
    availability.rooms.find((room) => room.id === query.roomId) ?? availability.rooms[0];
  const dayDate = days.includes(query.date) ? query.date : days[0];
  const dayRooms = isWeek ? [weekRoom] : availability.rooms;

  const rangeLabel = isWeek
    ? formatDayRange(availability.startDate, availability.endDate, locale)
    : formatWeekdayDate(query.date, locale);
  const dayLabel = formatWeekdayDate(dayDate, locale);
  const singleDayColumns = roomColumns({
    rooms: dayRooms,
    date: dayDate,
    index,
    locale,
    perHour: t("perHour"),
    intervalMinutes: availability.intervalMinutes,
  });
  const dayMinWidth = roomGridMinWidth(singleDayColumns.length);
  const navigationQuery: AvailabilityQuery = {
    ...query,
    roomId: isWeek ? weekRoom.id : query.roomId,
  };

  return (
    <div className="space-y-8">
      <AvailabilityToolbar
        locale={locale}
        query={navigationQuery}
        range={{startDate: availability.startDate, endDate: availability.endDate}}
        today={today}
      />

      <RoomFilter
        locale={locale}
        query={navigationQuery}
        rooms={availability.rooms}
        selectedRoomId={isWeek ? weekRoom.id : query.roomId}
        allowAllRooms={!isWeek}
      />

      <AvailabilityLegend labels={labels} />

      {isWeek ? (
        <>
          <div className="space-y-3 lg:hidden">
            <DayStrip
              locale={locale}
              query={navigationQuery}
              days={days}
              selectedDate={dayDate}
              today={today}
              todayLabel={t("today")}
            />
            <GridHeading label={dayLabel} />
            <AvailabilityGrid
              caption={`${weekRoom.name} — ${dayLabel}`}
              times={index.times}
              columns={singleDayColumns}
              labels={labels}
              minWidthClass={dayMinWidth}
            />
          </div>
          <div className="hidden space-y-3 lg:block">
            <GridHeading label={weekRoom.name} />
            <AvailabilityGrid
              caption={`${weekRoom.name} — ${rangeLabel}`}
              times={index.times}
              columns={dayColumns({
                days,
                room: weekRoom,
                today,
                index,
                locale,
                intervalMinutes: availability.intervalMinutes,
              })}
              labels={labels}
              minWidthClass="min-w-[48rem]"
            />
          </div>
        </>
      ) : (
        <AvailabilityGrid
          caption={dayLabel}
          times={index.times}
          columns={singleDayColumns}
          labels={labels}
          minWidthClass={dayMinWidth}
        />
      )}
    </div>
  );
}

/** Columns are rooms for a single day. */
function roomColumns({
  rooms,
  date,
  index,
  locale,
  perHour,
  intervalMinutes,
}: {
  rooms: AvailabilityRoom[];
  date: string;
  index: SlotIndex;
  locale: AppLocale;
  perHour: string;
  intervalMinutes: number;
}): GridColumn[] {
  return rooms.map((room) => ({
    key: room.id,
    heading: (
      <span className="block leading-tight">
        {room.name}
        <span className="mt-0.5 block font-sans text-[0.65rem] font-normal tabular-nums text-ink-muted">
          {formatChf(minorUnitsToFrancs(room.hourlyRateMinor), locale)}
          {perHour}
        </span>
      </span>
    ),
    cells: buildColumnCells(index.times, intervalMinutes, (time) =>
      withSlotHref(index.slotAt(room.id, date, time), room.id, date),
    ),
  }));
}

/** Columns are days for a single room. */
function dayColumns({
  days,
  room,
  today,
  index,
  locale,
  intervalMinutes,
}: {
  days: string[];
  room: AvailabilityRoom;
  today: string;
  index: SlotIndex;
  locale: AppLocale;
  intervalMinutes: number;
}): GridColumn[] {
  return days.map((date) => {
    const heading = formatDayHeading(date, locale);

    return {
      key: date,
      current: date === today,
      heading: (
        <span className="block leading-tight">
          <span className="block text-[0.65rem] uppercase tracking-[0.12em]">
            {heading.weekday}
          </span>
          <span className="mt-0.5 block font-sans text-base font-semibold tabular-nums">
            {heading.day}
          </span>
        </span>
      ),
      cells: buildColumnCells(index.times, intervalMinutes, (time) =>
        withSlotHref(index.slotAt(room.id, date, time), room.id, date),
      ),
    };
  });
}

function withSlotHref(
  slot: ReturnType<SlotIndex["slotAt"]>,
  roomId: string,
  date: string,
) {
  if (!slot) {
    return undefined;
  }
  if (slot.state === "available") {
    return {
      ...slot,
      href: bookHref({roomId, date, start: slot.localStart}),
    };
  }
  if (slot.state === "my-booking" && slot.ownBookingId) {
    return {
      ...slot,
      href: {
        pathname: "/rooms/bookings/[id]" as const,
        params: {id: slot.ownBookingId},
      },
    };
  }
  return slot;
}

/** A single room fits a phone; more rooms need room to breathe and may scroll. */
function roomGridMinWidth(columns: number): string {
  if (columns <= 1) {
    return "min-w-0";
  }

  return columns === 2 ? "min-w-[22rem]" : "min-w-[30rem]";
}

/** Names whichever slice of the payload the grid below is showing. */
function GridHeading({label}: {label: string}) {
  return <h2 className="text-lg leading-tight text-ink">{label}</h2>;
}

function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: {href: PathnameHref; label: string};
}) {
  return (
    <div className="rounded-panel border border-ink bg-white px-5 py-10 text-center">
      <p className="text-sm text-ink-muted">{message}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-5 inline-flex min-h-11 items-center rounded-panel border border-ink bg-white px-4 text-xs font-semibold uppercase tracking-[0.1em] transition-colors duration-150 ease-standard hover:bg-hover"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

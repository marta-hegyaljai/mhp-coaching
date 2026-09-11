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
import {ArrowRightIcon} from "@/shared/ui/icons";
import {SectionLabel} from "@/shared/ui/section-label";

import {AvailabilityGrid, type GridColumn} from "./grid";
import {AvailabilityLegend} from "./legend";
import {MobileWeekCalendar} from "./mobile-week-calendar";
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
        message={query.roomIds.length > 0 ? t("filteredRoomMissing") : t("emptyInventory")}
        action={
          query.roomIds.length > 0
            ? {href: availabilityHref({...query, roomIds: []}), label: t("allRooms")}
            : undefined
        }
      />
    );
  }

  const consideredRooms =
    query.roomIds.length > 0
      ? availability.rooms.filter((room) => query.roomIds.includes(room.id))
      : availability.rooms.filter((room) => room.active);
  const selectedRoom = consideredRooms.length === 1 ? consideredRooms[0] : undefined;
  const consideredRoomsLabel = selectedRoom?.name ??
    (query.roomIds.length > 0
      ? t("selectedRoomsTitle", {count: consideredRooms.length})
      : t("allRooms"));
  const dayDate = days.includes(query.date) ? query.date : days[0];
  const requiredSlots = Math.ceil(
    availability.minimumBookingMinutes / availability.intervalMinutes,
  );

  const rangeLabel = isWeek
    ? formatDayRange(availability.startDate, availability.endDate, locale)
    : formatWeekdayDate(query.date, locale);
  const dayLabel = formatWeekdayDate(dayDate, locale);
  const aggregateLabels = {
    roomsAvailable: (count: number) => t("roomsAvailable", {count}),
    bookAt: (time: string, count: number) => t("bookAtTime", {time, count}),
  };
  const columnsForDate = (date: string) =>
    selectedRoom
      ? roomColumns({
          rooms: [selectedRoom],
          date,
          index,
          locale,
          perHour: t("perHour"),
          intervalMinutes: availability.intervalMinutes,
          requiredSlots,
          bookAt: (room, time) => t("bookRoomAtTime", {room, time}),
        })
      : aggregateDayColumns({
          days: [date],
          rooms: consideredRooms,
          today,
          index,
          locale,
          intervalMinutes: availability.intervalMinutes,
          requiredSlots,
          labels: aggregateLabels,
          heading: consideredRoomsLabel,
        });
  const singleDayColumns = columnsForDate(dayDate);
  const dayMinWidth = roomGridMinWidth(singleDayColumns.length);
  const navigationQuery: AvailabilityQuery = {
    ...query,
    roomIds:
      query.roomIds.length > 0 ? consideredRooms.map((room) => room.id) : [],
  };

  return (
    <div className="space-y-8">
      <RoomFilter
        locale={locale}
        query={navigationQuery}
        rooms={availability.rooms}
        selectedRoomIds={navigationQuery.roomIds}
      />

      <BookingGuide
        label={t("bookingGuideLabel")}
        steps={[t("bookingGuideRoom"), t("bookingGuideTime"), t("bookingGuideConfirm")]}
        help={t("calendarAvailabilityHelp")}
      />

      <section id="availability-calendar" className="space-y-3 scroll-mt-36">
        <AvailabilityLegend labels={labels} />
        <div className="sticky top-14 z-30 -mx-3 space-y-3 border-b border-ink bg-white px-3 pb-3 sm:top-16 sm:mx-0 sm:px-0">
          <AvailabilityToolbar
            locale={locale}
            query={navigationQuery}
            range={{startDate: availability.startDate, endDate: availability.endDate}}
            today={today}
          />
        </div>

        {isWeek ? (
          <>
            <div className="lg:hidden">
              <MobileWeekCalendar
                locale={locale}
                days={days}
                initialDate={dayDate}
                today={today}
                todayLabel={t("today")}
                panels={days.map((date) => ({
                  date,
                  content: (
                    <div className="space-y-3">
                      <GridHeading label={consideredRoomsLabel} />
                      <AvailabilityGrid
                        caption={`${consideredRoomsLabel} — ${formatWeekdayDate(date, locale)}`}
                        times={index.times}
                        columns={columnsForDate(date)}
                        labels={labels}
                        minWidthClass={dayMinWidth}
                      />
                    </div>
                  ),
                }))}
              />
            </div>
            <div className="hidden space-y-3 lg:block">
            <GridHeading label={consideredRoomsLabel} />
            <AvailabilityGrid
              caption={`${consideredRoomsLabel} — ${rangeLabel}`}
              times={index.times}
              columns={
                selectedRoom
                  ? dayColumns({
                      days,
                      room: selectedRoom,
                      today,
                      index,
                      locale,
                      intervalMinutes: availability.intervalMinutes,
                      requiredSlots,
                      bookAt: (room, time) => t("bookRoomAtTime", {room, time}),
                    })
                    : aggregateDayColumns({
                      days,
                      rooms: consideredRooms,
                      today,
                      index,
                      locale,
                      intervalMinutes: availability.intervalMinutes,
                      requiredSlots,
                      labels: aggregateLabels,
                    })
              }
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
      </section>
    </div>
  );
}

function BookingGuide({
  label,
  steps,
  help,
}: {
  label: string;
  steps: string[];
  help: string;
}) {
  return (
    <section
      className="rounded-panel border border-ink bg-shell px-4 py-4 sm:px-5"
      aria-label={label}
    >
      <SectionLabel>{label}</SectionLabel>
      <ol className="mt-3 grid gap-2 text-sm font-semibold text-ink sm:grid-cols-3 sm:gap-4">
        {steps.map((step) => (
          <li key={step} className="flex items-center gap-2">
            <ArrowRightIcon className="h-3.5 w-3.5" />
            {step}
          </li>
        ))}
      </ol>
      <p className="mt-3 border-t border-line-soft pt-3 text-xs leading-5 text-ink-muted">
        {help}
      </p>
    </section>
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
  requiredSlots,
  bookAt,
}: {
  rooms: AvailabilityRoom[];
  date: string;
  index: SlotIndex;
  locale: AppLocale;
  perHour: string;
  intervalMinutes: number;
  requiredSlots: number;
  bookAt: (room: string, time: string) => string;
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
    cells: buildColumnCells(index.times, intervalMinutes, (time) => {
      const slot = index.slotAt(room.id, date, time);
      return withSlotHref(
        slot,
        room.id,
        date,
        isBookableStart({roomId: room.id, date, time, index, requiredSlots}),
        slot?.state === "available" ? bookAt(room.name, time) : undefined,
      );
    }),
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
  requiredSlots,
  bookAt,
}: {
  days: string[];
  room: AvailabilityRoom;
  today: string;
  index: SlotIndex;
  locale: AppLocale;
  intervalMinutes: number;
  requiredSlots: number;
  bookAt: (room: string, time: string) => string;
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
      cells: buildColumnCells(index.times, intervalMinutes, (time) => {
        const slot = index.slotAt(room.id, date, time);
        return withSlotHref(
          slot,
          room.id,
          date,
          isBookableStart({roomId: room.id, date, time, index, requiredSlots}),
          slot?.state === "available" ? bookAt(room.name, time) : undefined,
        );
      }),
    };
  });
}

/** One time-first column per day, combining every room into one decision. */
function aggregateDayColumns({
  days,
  rooms,
  today,
  index,
  locale,
  intervalMinutes,
  requiredSlots,
  labels,
  heading,
}: {
  days: string[];
  rooms: AvailabilityRoom[];
  today: string;
  index: SlotIndex;
  locale: AppLocale;
  intervalMinutes: number;
  requiredSlots: number;
  labels: {
    roomsAvailable: (count: number) => string;
    bookAt: (time: string, count: number) => string;
  };
  heading?: string;
}): GridColumn[] {
  return days.map((date) => {
    const dateHeading = formatDayHeading(date, locale);

    return {
      key: `all-${date}`,
      current: date === today,
      heading: heading ? (
        <span className="block leading-tight">{heading}</span>
      ) : (
        <span className="block leading-tight">
          <span className="block text-[0.65rem] uppercase tracking-[0.12em]">
            {dateHeading.weekday}
          </span>
          <span className="mt-0.5 block font-sans text-base font-semibold tabular-nums">
            {dateHeading.day}
          </span>
        </span>
      ),
      cells: buildColumnCells(index.times, intervalMinutes, (time) => {
        const slots = rooms
          .map((room) => index.slotAt(room.id, date, time))
          .filter((slot) => slot !== undefined);
        const own = slots.find((slot) => slot.state === "my-booking");
        if (own) {
          return withSlotHref(own, own.roomId, date, false);
        }

        const bookableRooms = rooms.filter((room) =>
          isBookableStart({roomId: room.id, date, time, index, requiredSlots}),
        );
        const chosen = bookableRooms[0];
        if (chosen) {
          const slot = index.slotAt(chosen.id, date, time);
          if (!slot) {
            return undefined;
          }
          return {
            ...slot,
            state: "available" as const,
            href: bookHref({
              roomId: chosen.id,
              roomIds: bookableRooms.map((room) => room.id),
              date,
              start: time,
            }),
            meta: labels.roomsAvailable(bookableRooms.length),
            ariaLabel: labels.bookAt(time, bookableRooms.length),
          };
        }

        const representative = slots[0];
        if (!representative) {
          return undefined;
        }

        return {
          ...representative,
          state: slots.some((slot) => slot.state === "booked")
            ? ("booked" as const)
            : ("unavailable" as const),
          ownBookingId: undefined,
        };
      }),
    };
  });
}

function isBookableStart({
  roomId,
  date,
  time,
  index,
  requiredSlots,
}: {
  roomId: string;
  date: string;
  time: string;
  index: SlotIndex;
  requiredSlots: number;
}): boolean {
  const startIndex = index.times.indexOf(time);
  if (startIndex < 0 || startIndex + requiredSlots > index.times.length) {
    return false;
  }

  return index.times
    .slice(startIndex, startIndex + requiredSlots)
    .every((candidate) => index.slotAt(roomId, date, candidate)?.state === "available");
}

function withSlotHref(
  slot: ReturnType<SlotIndex["slotAt"]>,
  roomId: string,
  date: string,
  bookable: boolean,
  ariaLabel?: string,
) {
  if (!slot) {
    return undefined;
  }
  if (slot.state === "available" && bookable) {
    return {
      ...slot,
      href: bookHref({roomId, date, start: slot.localStart}),
      ...(ariaLabel ? {ariaLabel} : {}),
    };
  }
  if (slot.state === "available") {
    return {...slot, state: "unavailable" as const};
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

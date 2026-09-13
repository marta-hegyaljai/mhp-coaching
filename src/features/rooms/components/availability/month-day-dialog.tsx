"use client";

import {useActionState, useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert} from "@/features/auth/components/auth-field";
import {isFreeCancellation} from "@/features/rooms/billing";
import {
  cancelRoomBookingOnCalendarAction,
  moveRoomBookingOnCalendarAction,
  reserveRoomOnCalendarAction,
} from "@/features/rooms/actions";
import {AmountSummary} from "@/features/rooms/components/booking/amount-summary";
import {DestructiveConfirm} from "@/features/rooms/components/booking/destructive-confirm";
import {NoticePanel} from "@/features/rooms/components/booking/notice-panel";
import {SlotFields} from "@/features/rooms/components/booking/slot-fields";
import {PRIVATE_NOTE_MAX_LENGTH} from "@/features/rooms/limits";
import type {MonthDayBooking} from "@/features/rooms/month-layout";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {intlLocale} from "@/i18n/intl-locale";
import type {AppLocale} from "@/i18n/routing";
import {Button} from "@/shared/ui/button";
import {SelectField, TextareaField} from "@/shared/ui/field";
import {SubmitButton} from "@/shared/ui/submit-button";

import {
  buildCalendarSlotOptions,
  resolveCalendarSlotDraft,
  roomIdsForRange,
} from "./calendar-slot-preview";
import {
  pickPreferredRoomId,
  writeLastRoomPreference,
} from "./last-room-preference";
import {
  loadMonthDayGridAction,
  type MonthDayGrid,
} from "./month-day-actions";
import {dragSlotsForDay, firstBookableRange} from "./month-day-slots";

type DayPanel =
  | {kind: "list"}
  | {kind: "add"}
  | {kind: "change"; bookingId: string}
  | {kind: "cancel"; bookingId: string};

function formatBookingTime(start: string, end: string): string {
  return `${start}–${end === "00:00" ? "24:00" : end}`;
}

function canMutateBooking(startsAt: string, now: Date): boolean {
  return new Date(startsAt).getTime() > now.getTime();
}

export function MonthDayDialog({
  locale,
  date,
  bookings,
  roomIds,
  discountPercent,
  cancellationNoticeHours,
  onClose,
  onChanged,
}: {
  locale: AppLocale;
  date: string;
  bookings: MonthDayBooking[];
  roomIds: string[];
  discountPercent: number;
  cancellationNoticeHours: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  const t = useTranslations("Rooms");
  const [panel, setPanel] = useState<DayPanel>({kind: "list"});
  const now = useMemo(() => new Date(), []);
  const dateLabel = new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));

  const booking = (id: string) => bookings.find((item) => item.id === id);

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-subheading">{dateLabel}</h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
            {t("monthBookingCount", {count: bookings.length})}
          </p>
        </div>
        <Button type="button" variant="quiet" onClick={onClose}>
          {t("closeDialog")}
        </Button>
      </div>

      {panel.kind === "list" ? (
        <DayBookingList
          bookings={bookings}
          now={now}
          emptyLabel={t("monthNoBookings")}
          addLabel={t("monthAddBooking")}
          changeLabel={t("changeBooking")}
          cancelLabel={t("cancelBooking")}
          onAdd={() => setPanel({kind: "add"})}
          onChange={(bookingId) => setPanel({kind: "change", bookingId})}
          onCancel={(bookingId) => setPanel({kind: "cancel", bookingId})}
        />
      ) : null}

      {panel.kind === "add" ? (
        <DaySlotForm
          locale={locale}
          date={date}
          roomIds={roomIds}
          discountPercent={discountPercent}
          title={t("monthAddBooking")}
          backLabel={t("monthBackToDay")}
          onBack={() => setPanel({kind: "list"})}
          onDone={() => {
            onChanged();
            onClose();
          }}
        />
      ) : null}

      {panel.kind === "change" && booking(panel.bookingId) ? (
        <DaySlotForm
          locale={locale}
          date={date}
          roomIds={roomIds}
          discountPercent={discountPercent}
          exceptBookingId={panel.bookingId}
          booking={booking(panel.bookingId)}
          cancellationNoticeHours={cancellationNoticeHours}
          title={t("monthChangeBooking")}
          backLabel={t("monthBackToDay")}
          onBack={() => setPanel({kind: "list"})}
          onDone={onChanged}
        />
      ) : null}

      {panel.kind === "cancel" && booking(panel.bookingId) ? (
        <DayCancelForm
          locale={locale}
          booking={booking(panel.bookingId)!}
          cancellationNoticeHours={cancellationNoticeHours}
          backLabel={t("monthBackToDay")}
          onBack={() => setPanel({kind: "list"})}
          onDone={onChanged}
        />
      ) : null}
    </div>
  );
}

function DayBookingList({
  bookings,
  now,
  emptyLabel,
  addLabel,
  changeLabel,
  cancelLabel,
  onAdd,
  onChange,
  onCancel,
}: {
  bookings: MonthDayBooking[];
  now: Date;
  emptyLabel: string;
  addLabel: string;
  changeLabel: string;
  cancelLabel: string;
  onAdd: () => void;
  onChange: (bookingId: string) => void;
  onCancel: (bookingId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {bookings.length === 0 ? (
        <p className="text-sm leading-6 text-ink-muted">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-line-soft border-y border-line-soft">
          {bookings.map((item) => {
            const mutable = canMutateBooking(item.startsAt, now);
            return (
              <li key={item.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-sans text-sm font-semibold tabular-nums text-ink">
                    {formatBookingTime(item.localStart, item.localEnd)}
                  </p>
                  <p className="truncate text-sm text-ink-muted">{item.roomName}</p>
                </div>
                {mutable ? (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={() => onChange(item.id)}>
                      {changeLabel}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => onCancel(item.id)}>
                      {cancelLabel}
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <Button type="button" onClick={onAdd}>
        {addLabel}
      </Button>
    </div>
  );
}

function DaySlotForm({
  locale,
  date,
  roomIds,
  discountPercent,
  exceptBookingId,
  booking,
  cancellationNoticeHours,
  title,
  backLabel,
  onBack,
  onDone,
}: {
  locale: AppLocale;
  date: string;
  roomIds: string[];
  discountPercent: number;
  exceptBookingId?: string;
  booking?: MonthDayBooking;
  cancellationNoticeHours?: number;
  title: string;
  backLabel: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("Rooms");
  const {grid, loading, failed} = useMonthDayGrid(date, roomIds);
  const action = exceptBookingId
    ? moveRoomBookingOnCalendarAction.bind(null, locale, exceptBookingId)
    : reserveRoomOnCalendarAction.bind(null, locale);
  const [state, formAction, pending] = useActionState(action, null);
  const [roomId, setRoomId] = useState(booking?.roomId ?? "");
  const [draft, setDraft] = useState({
    start: booking?.localStart ?? "",
    end: booking?.localEnd === "24:00" ? "00:00" : (booking?.localEnd ?? ""),
  });

  useEffect(() => {
    if (state?.ok) {
      onDone();
    }
  }, [onDone, state]);

  const columnSlots = useMemo(() => {
    if (!grid) {
      return [];
    }
    return dragSlotsForDay({
      date,
      roomIds: grid.rooms.map((room) => room.id),
      slots: grid.slots,
      exceptBookingId,
    });
  }, [date, exceptBookingId, grid]);

  const initialRange = useMemo(
    () =>
      grid
        ? firstBookableRange(
            columnSlots,
            grid.intervalMinutes,
            grid.minimumBookingMinutes,
          )
        : null,
    [columnSlots, grid],
  );

  const activeStart = draft.start || initialRange?.start || "";
  const activeEnd = draft.end || initialRange?.end || "";
  const roomIdsForDraft = useMemo(
    () => roomIdsForRange(columnSlots, activeStart, activeEnd || activeStart),
    [activeEnd, activeStart, columnSlots],
  );
  const preferredRoomId =
    pickPreferredRoomId(roomIdsForDraft, roomId || booking?.roomId) ??
    roomIdsForDraft[0] ??
    "";
  const activeRoom = grid?.rooms.find((room) => room.id === preferredRoomId);

  const slotOptions = useMemo(() => {
    if (!grid || !activeRoom) {
      return null;
    }
    return buildCalendarSlotOptions({
      slots: columnSlots,
      roomId: activeRoom.id,
      intervalMinutes: grid.intervalMinutes,
      minimumBookingMinutes: grid.minimumBookingMinutes,
      maximumBookingMinutes: grid.maximumBookingMinutes,
      hourlyRateMinor: activeRoom.hourlyRateMinor,
      discountPercent,
    });
  }, [activeRoom, columnSlots, discountPercent, grid]);

  const resolved = resolveCalendarSlotDraft(
    {start: activeStart, end: activeEnd},
    slotOptions,
  );
  const availableRoomIds = useMemo(
    () => roomIdsForRange(columnSlots, resolved.start, resolved.end),
    [columnSlots, resolved.end, resolved.start],
  );
  const availableRooms = (grid?.rooms ?? []).filter((room) =>
    availableRoomIds.includes(room.id),
  );
  const room =
    availableRooms.find((candidate) => candidate.id === preferredRoomId) ?? availableRooms[0];
  const quote = resolved.quote;
  const ready = resolved.ready && Boolean(room && availableRoomIds.includes(room.id));
  const late =
    booking && cancellationNoticeHours !== undefined
      ? !isFreeCancellation(new Date(booking.startsAt), new Date(), cancellationNoticeHours)
      : false;

  if (loading) {
    return <p className="text-sm text-ink-muted">{t("monthLoadingDay")}</p>;
  }

  if (failed || !grid) {
    return (
      <div className="space-y-4">
        <AuthAlert>{t("monthDayUnavailable")}</AuthAlert>
        <Button type="button" variant="quiet" onClick={onBack}>
          {backLabel}
        </Button>
      </div>
    );
  }

  if (!room || !quote) {
    return (
      <div className="space-y-4">
        <AuthAlert>{t("selectionNoRoom")}</AuthAlert>
        <Button type="button" variant="quiet" onClick={onBack}>
          {backLabel}
        </Button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-5"
      onSubmit={() => writeLastRoomPreference(room.id)}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <Button type="button" variant="quiet" onClick={onBack}>
          {backLabel}
        </Button>
      </div>

      {late && booking ? (
        <NoticePanel
          label={t("billingLate")}
          message={t("changeLateWarning", {
            amount: formatChf(minorUnitsToFrancs(booking.amountMinor), locale),
          })}
          amount={formatChf(minorUnitsToFrancs(booking.amountMinor), locale)}
        />
      ) : null}

      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}

      <input type="hidden" name="roomId" value={room.id} />
      <input type="hidden" name="date" value={date} />

      <SelectField
        id="month-day-room"
        label={t("chooseAvailableRoom")}
        help={
          availableRooms.length > 1
            ? t("chooseAvailableRoomHelp", {count: availableRooms.length})
            : grid.rooms.length > 1
              ? t("onlyRoomAvailableNote", {room: room.name})
              : undefined
        }
        value={room.id}
        onChange={(event) => {
          const nextRoomId = event.target.value;
          setRoomId(nextRoomId);
          writeLastRoomPreference(nextRoomId);
        }}
      >
        {availableRooms.map((candidate) => (
          <option key={candidate.id} value={candidate.id}>
            {candidate.name} · {formatChf(minorUnitsToFrancs(candidate.hourlyRateMinor), locale)}
            {t("perHour")}
          </option>
        ))}
      </SelectField>

      <SlotFields
        starts={slotOptions?.starts ?? []}
        selection={{
          start: resolved.start,
          end: resolved.end,
          ends: resolved.ends,
          quote,
          ready,
          selectStart: (time) => setDraft({start: time, end: ""}),
          selectEnd: (time) => setDraft({start: resolved.start, end: time}),
        }}
      />

      <AmountSummary
        locale={locale}
        durationMinutes={quote.durationMinutes}
        rateMinor={room.hourlyRateMinor}
        amountMinor={quote.amountMinor}
        discountPercent={quote.discountPercent}
        showBillingNote
      />

      {exceptBookingId ? null : (
        <TextareaField
          id="month-day-note"
          name="note"
          label={t("privateNote")}
          help={t("privateNoteHelp")}
          maxLength={PRIVATE_NOTE_MAX_LENGTH}
          autoComplete="off"
          spellCheck={false}
        />
      )}

      <SubmitButton
        pending={pending}
        disabled={!ready}
        label={exceptBookingId ? t("confirmChange") : t("confirmBooking")}
        pendingLabel={t("confirming")}
      />
    </form>
  );
}

function DayCancelForm({
  locale,
  booking,
  cancellationNoticeHours,
  backLabel,
  onBack,
  onDone,
}: {
  locale: AppLocale;
  booking: MonthDayBooking;
  cancellationNoticeHours: number;
  backLabel: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("Rooms");
  const [state, action, pending] = useActionState(
    cancelRoomBookingOnCalendarAction.bind(null, locale, booking.id),
    null,
  );
  const late = !isFreeCancellation(
    new Date(booking.startsAt),
    new Date(),
    cancellationNoticeHours,
  );
  const amount = formatChf(minorUnitsToFrancs(booking.amountMinor), locale);

  useEffect(() => {
    if (state?.ok) {
      onDone();
    }
  }, [onDone, state]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">{t("monthCancelBooking")}</h3>
        <Button type="button" variant="quiet" onClick={onBack}>
          {backLabel}
        </Button>
      </div>
      <p className="font-sans text-sm tabular-nums text-ink">
        {formatBookingTime(booking.localStart, booking.localEnd)} · {booking.roomName}
      </p>
      <DestructiveConfirm
        embedded
        label={t("cancelTitle")}
        message={late ? t("cancelLateHelp", {amount}) : t("cancelFreeHelp")}
        note={t("releaseNote")}
        retained={late ? {label: t("retainedCharge"), amount} : undefined}
        keep={{onClick: onBack, label: t("keepBooking")}}
        confirm={{label: t("confirmCancel"), pendingLabel: t("confirmingCancel")}}
        action={action}
        pending={pending}
        error={state?.error}
      />
    </div>
  );
}

function useMonthDayGrid(date: string, roomIds: string[]) {
  const roomKey = roomIds.join(",");
  const [result, setResult] = useState<
    {status: "ready"; grid: MonthDayGrid} | {status: "failed"} | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    void loadMonthDayGridAction({
      date,
      roomIds: roomKey ? roomKey.split(",") : [],
    }).then((payload) => {
      if (cancelled) {
        return;
      }
      if ("error" in payload) {
        setResult({status: "failed"});
        return;
      }
      setResult({status: "ready", grid: payload});
    });

    return () => {
      cancelled = true;
    };
  }, [date, roomKey]);

  return {
    grid: result?.status === "ready" ? result.grid : null,
    loading: result === null,
    failed: result?.status === "failed",
  };
}

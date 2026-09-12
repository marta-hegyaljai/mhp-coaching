"use client";

import {useActionState, useEffect, useMemo, useRef, useState, type ReactNode} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert} from "@/features/auth/components/auth-field";
import {AmountSummary} from "@/features/rooms/components/booking/amount-summary";
import {reserveRoomAction} from "@/features/rooms/actions";
import {PRIVATE_NOTE_MAX_LENGTH} from "@/features/rooms/limits";
import {quoteRoomBooking} from "@/features/rooms/pricing";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import type {AvailabilityRoom} from "@/features/rooms/availability";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {SelectField, TextareaField} from "@/shared/ui/field";
import {SubmitButton} from "@/shared/ui/submit-button";
import {Button} from "@/shared/ui/button";

import {mergeSlotRuns, type RunCell} from "./runs";
import {slotMetaClass, slotSurface, type SlotLabels} from "./slot-styles";
import {
  completeDragSelection,
  slotsFromColumn,
  type DragFailure,
  type DragSelection,
} from "./drag-select";

export type GridColumn = {
  key: string;
  heading: ReactNode;
  current?: boolean;
  cells: RunCell[];
};

export type CalendarReserveContext = {
  locale: AppLocale;
  intervalMinutes: number;
  minimumBookingMinutes: number;
  maximumBookingMinutes: number | null;
  rooms: AvailabilityRoom[];
  discountPercent: number;
};

/**
 * A time grid whose rows stay aligned across columns while consecutive slots
 * of the same state render as a single spanning bar. Available time is chosen
 * by dragging or tapping a range; the reserve form opens on this page.
 */
export function AvailabilityGrid({
  caption,
  times,
  columns,
  labels,
  minWidthClass = "min-w-[22rem]",
  reserve,
}: {
  caption: string;
  times: string[];
  columns: GridColumn[];
  labels: SlotLabels;
  minWidthClass?: string;
  reserve: CalendarReserveContext;
}) {
  const t = useTranslations("Rooms");
  const [draft, setDraft] = useState<{columnKey: string; from: number; to: number} | null>(null);
  const draftRef = useRef<{columnKey: string; from: number; to: number} | null>(null);
  const [selection, setSelection] = useState<DragSelection | null>(null);
  const [notice, setNotice] = useState<DragFailure | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const plans = columns.map((column) => {
    const runs = mergeSlotRuns(column.cells);
    const covered = new Set<number>();

    for (const run of runs) {
      for (let offset = 1; offset < run.span; offset += 1) {
        covered.add(run.startIndex + offset);
      }
    }

    return {
      byStart: new Map(runs.map((run) => [run.startIndex, run])),
      covered,
    };
  });

  const slotsByColumn = useMemo(() => {
    const map = new Map<string, ReturnType<typeof slotsFromColumn>>();
    for (const column of columns) {
      map.set(column.key, slotsFromColumn({columnKey: column.key, cells: column.cells}));
    }
    return map;
  }, [columns]);

  function finishDrag(columnKey: string, from: number, to: number) {
    const slots = slotsByColumn.get(columnKey) ?? [];
    const result = completeDragSelection({
      slots,
      columnKey,
      fromIndex: from,
      toIndex: to,
      intervalMinutes: reserve.intervalMinutes,
      minimumBookingMinutes: reserve.minimumBookingMinutes,
      maximumBookingMinutes: reserve.maximumBookingMinutes,
    });
    draftRef.current = null;
    setDraft(null);
    if (!result.ok) {
      setNotice(result.reason);
      return;
    }
    setNotice(null);
    setSelection(result.selection);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (selection) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [selection]);

  const highlighted =
    draft &&
    new Set(
      Array.from(
        {length: Math.abs(draft.to - draft.from) + 1},
        (_, offset) => Math.min(draft.from, draft.to) + offset,
      ),
    );

  const noticeMessage =
    notice === "too-short"
      ? t("selectionTooShort", {minutes: reserve.minimumBookingMinutes})
      : notice === "too-long" && reserve.maximumBookingMinutes
        ? t("selectionTooLong", {minutes: reserve.maximumBookingMinutes})
        : notice === "no-room"
          ? t("selectionNoRoom")
          : notice
            ? t("selectionUnavailable")
            : null;

  return (
    <div className="space-y-3">
      {noticeMessage ? <AuthAlert>{noticeMessage}</AuthAlert> : null}
      <div className="overflow-x-auto">
        <table
          className={`w-full border-separate border-spacing-[3px] text-left ${minWidthClass}`}
        >
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="w-14 p-0">
                <span className="sr-only">{caption}</span>
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-current={column.current ? "date" : undefined}
                  className={`border-b px-2 pb-2 align-bottom text-xs font-semibold ${
                    column.current ? "border-ink text-ink" : "border-line text-ink-muted"
                  }`}
                >
                  {column.heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {times.map((time, rowIndex) => (
              <tr key={time}>
                <th
                  scope="row"
                  className={`h-11 whitespace-nowrap pr-2 text-right align-middle font-sans text-[0.7rem] leading-none tabular-nums ${
                    time.endsWith(":00")
                      ? "font-semibold text-ink"
                      : "font-normal text-ink-subtle"
                  }`}
                >
                  {time}
                </th>
                {columns.map((column, columnIndex) => {
                  const run = plans[columnIndex].byStart.get(rowIndex);

                  if (!run) {
                    return plans[columnIndex].covered.has(rowIndex) ? null : (
                      <td key={column.key} className="h-11 border border-line bg-shell" />
                    );
                  }

                  const selectable = Boolean(run.select);
                  const body = (
                    <>
                      <span className="flex items-center justify-between gap-1 text-[0.62rem] font-semibold uppercase tracking-[0.08em] leading-tight">
                        <span>{labels[run.state]}</span>
                        {run.href ? <ArrowRightIcon className="h-3 w-3" /> : null}
                      </span>
                      {run.meta || run.span > 1 ? (
                        <span
                          className={`mt-0.5 block font-sans text-[0.62rem] leading-tight tabular-nums ${slotMetaClass(run.state, Boolean(run.href) || selectable)}`}
                        >
                          {run.meta ?? `${run.startTime}–${run.endTime}`}
                        </span>
                      ) : null}
                    </>
                  );

                  return (
                    <td
                      key={column.key}
                      rowSpan={run.span}
                      className={`relative border px-2 py-1 align-top ${slotSurface[run.state]} ${
                        run.href || selectable ? "p-0" : ""
                      }`}
                    >
                      {selectable ? (
                        <div className="relative" style={{minHeight: `${run.span * 2.75}rem`}}>
                          <div className="pointer-events-none absolute inset-0 px-2 py-1">
                            {body}
                          </div>
                          <div
                            className="absolute inset-0 grid"
                            style={{
                              gridTemplateRows: `repeat(${run.span}, minmax(2.75rem, 1fr))`,
                            }}
                          >
                            {Array.from({length: run.span}, (_, offset) => {
                              const index = run.startIndex + offset;
                              const cell = column.cells[index];
                              const active =
                                draft?.columnKey === column.key && highlighted?.has(index);
                              return (
                                <button
                                  key={`${column.key}-${index}`}
                                  type="button"
                                  className={`min-h-11 touch-none select-none focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ink ${
                                    active ? "bg-ink text-parchment" : "bg-transparent"
                                  }`}
                                  aria-label={t("selectTime", {time: cell?.startTime ?? time})}
                                  data-column-key={column.key}
                                  data-slot-index={index}
                                  onPointerDown={(event) => {
                                    event.preventDefault();
                                    event.currentTarget.setPointerCapture(event.pointerId);
                                    const next = {columnKey: column.key, from: index, to: index};
                                    draftRef.current = next;
                                    setDraft(next);
                                  }}
                                  onPointerMove={(event) => {
                                    const current = draftRef.current;
                                    if (current?.columnKey !== column.key) {
                                      return;
                                    }
                                    const hit = document
                                      .elementFromPoint(event.clientX, event.clientY)
                                      ?.closest("[data-slot-index]");
                                    if (!(hit instanceof HTMLElement)) {
                                      return;
                                    }
                                    if (hit.dataset.columnKey !== column.key) {
                                      return;
                                    }
                                    const nextIndex = Number.parseInt(hit.dataset.slotIndex ?? "", 10);
                                    if (Number.isFinite(nextIndex) && nextIndex !== current.to) {
                                      const next = {...current, to: nextIndex};
                                      draftRef.current = next;
                                      setDraft(next);
                                    }
                                  }}
                                  onPointerUp={() => {
                                    const current = draftRef.current;
                                    if (current?.columnKey === column.key) {
                                      finishDrag(column.key, current.from, current.to);
                                    }
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ) : run.href ? (
                        <Link
                          href={run.href}
                          className={`block h-full min-h-11 cursor-pointer px-2 py-1 transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ink ${
                            run.state === "my-booking"
                              ? "hover:bg-white hover:text-ink"
                              : "hover:bg-ink hover:text-parchment"
                          }`}
                          aria-label={
                            run.ariaLabel ??
                            `${labels[run.state]} ${run.startTime}–${run.endTime}`
                          }
                        >
                          {body}
                        </Link>
                      ) : (
                        <div className="px-2 py-1">{body}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dialog
        ref={dialogRef}
        className="w-[min(28rem,calc(100%-1.5rem))] rounded-panel border border-ink bg-white p-0 text-ink backdrop:bg-ink/35"
        onClose={() => setSelection(null)}
      >
        {selection ? (
          <ReserveDialog
            selection={selection}
            reserve={reserve}
            onClose={() => setSelection(null)}
          />
        ) : null}
      </dialog>
    </div>
  );
}

function ReserveDialog({
  selection,
  reserve,
  onClose,
}: {
  selection: DragSelection;
  reserve: CalendarReserveContext;
  onClose: () => void;
}) {
  const t = useTranslations("Rooms");
  const rooms = reserve.rooms.filter((room) => selection.roomIds.includes(room.id));
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? selection.roomIds[0]);
  const room = rooms.find((candidate) => candidate.id === roomId) ?? rooms[0];
  const [state, action, pending] = useActionState(
    reserveRoomAction.bind(null, reserve.locale),
    null,
  );
  const quote = room
    ? quoteRoomBooking({
        hourlyRateMinor: room.hourlyRateMinor,
        durationMinutes: selection.durationMinutes,
        discountPercent: reserve.discountPercent,
      })
    : null;

  if (!room || !quote) {
    return null;
  }

  return (
    <form action={action} className="space-y-5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-subheading">{t("reserveOnCalendar")}</h2>
          <p className="mt-1 font-sans text-sm tabular-nums text-ink-muted">
            {selection.date} · {t("selectedRange", {start: selection.start, end: selection.end})}
          </p>
        </div>
        <Button type="button" variant="quiet" onClick={onClose}>
          {t("closeDialog")}
        </Button>
      </div>

      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}

      <input type="hidden" name="roomId" value={room.id} />
      <input type="hidden" name="date" value={selection.date} />
      <input type="hidden" name="start" value={selection.start} />
      <input type="hidden" name="end" value={selection.end} />

      {rooms.length > 1 ? (
        <SelectField
          id="calendar-room"
          label={t("chooseAvailableRoom")}
          value={roomId}
          onChange={(event) => setRoomId(event.target.value)}
        >
          {rooms.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name} · {formatChf(minorUnitsToFrancs(candidate.hourlyRateMinor), reserve.locale)}
              {t("perHour")}
            </option>
          ))}
        </SelectField>
      ) : (
        <p className="text-sm text-ink">
          {room.name} · {formatChf(minorUnitsToFrancs(room.hourlyRateMinor), reserve.locale)}
          {t("perHour")}
        </p>
      )}

      <AmountSummary
        locale={reserve.locale}
        durationMinutes={quote.durationMinutes}
        rateMinor={room.hourlyRateMinor}
        amountMinor={quote.amountMinor}
        discountPercent={quote.discountPercent}
        showBillingNote
      />

      <TextareaField
        id="calendar-note"
        name="note"
        label={t("privateNote")}
        help={t("privateNoteHelp")}
        maxLength={PRIVATE_NOTE_MAX_LENGTH}
        autoComplete="off"
        spellCheck={false}
      />

      <SubmitButton
        pending={pending}
        label={t("confirmBooking")}
        pendingLabel={t("confirming")}
      />
    </form>
  );
}

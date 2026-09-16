"use client";

import {useTranslations} from "next-intl";

import {formatCourseDateRange, formatSessionDateMark} from "@/features/courses/dates";
import {sessionAvailabilityOf} from "@/features/courses/types";
import type {AppLocale} from "@/i18n/routing";
import {Chip} from "@/shared/ui/chip";
import {ChevronDownIcon} from "@/shared/ui/icons";

import {occupancyRatio, type SessionEntry} from "./model";
import {SessionEditor} from "./session-editor";
import {placeSummary} from "./session-fields";

/**
 * One session as a calendar-style row: the start day is the scan target,
 * then the range, place and seats. Opening it swaps the row for its editor
 * in place, so the list stays the overview even while a session is changed.
 */
export function SessionRow({
  courseId,
  entry,
  locale,
  open,
  onToggle,
}: {
  courseId: string;
  entry: SessionEntry;
  locale: AppLocale;
  open: boolean;
  onToggle: (open: boolean) => void;
}) {
  const t = useTranslations("Admin");
  const panelId = `session-panel-${entry.date.id}`;
  const {date, isPast} = entry;
  const muted = isPast || !date.active;
  const mark = formatSessionDateMark(date.startDate, locale);
  const full = entry.capacity > 0 && entry.seatsLeft === 0;
  const availability = sessionAvailabilityOf(date);
  const markedClosed = availability === "registration_closed";
  const markedFull = availability === "full" || full;

  return (
    <li className="border-b border-line-soft last:border-b-0">
      <button
        type="button"
        onClick={() => onToggle(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`grid w-full cursor-pointer grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-2 text-left transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink sm:px-4 lg:grid-cols-[2.75rem_minmax(11rem,1.15fr)_minmax(0,1fr)_7.25rem] ${
          open ? "bg-hover" : ""
        }`}
      >
        <span
          aria-hidden="true"
          className={`flex size-11 shrink-0 flex-col items-center justify-center rounded-panel border ${
            muted ? "border-line text-ink-muted" : "border-ink text-ink"
          }`}
        >
          <span className="font-sans text-base font-semibold leading-none tabular-nums">
            {mark.day}
          </span>
          <span className="mt-0.5 text-[0.6rem] font-bold uppercase leading-none tracking-[0.12em]">
            {mark.month}
          </span>
        </span>

        <span className="min-w-0">
          <span className="sr-only">{t("coursesSessionEdit")}: </span>
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={`font-sans text-sm font-semibold tabular-nums ${
                muted ? "text-ink-muted" : "text-ink"
              }`}
            >
              {formatCourseDateRange(date, locale)}
            </span>
            {!date.active ? <Chip tone="strong">{t("coursesSessionInactive")}</Chip> : null}
            {isPast ? <Chip>{t("coursesSessionPast")}</Chip> : null}
            {markedClosed && date.active && !isPast ? (
              <Chip>{t("coursesSessionAvailability_registration_closed")}</Chip>
            ) : null}
            {markedFull && !markedClosed && date.active && !isPast ? (
              <Chip>{t("coursesSessionFull")}</Chip>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-xs text-ink-subtle lg:hidden">
            {placeSummary(date.location, date.venue, locale, t("coursesSessionVenueNone"))}
            <span aria-hidden="true"> · </span>
            <span className="tabular-nums">
              {t("coursesSessionDayCount", {count: entry.dayCount})}
            </span>
          </span>
        </span>

        <span className="hidden min-w-0 truncate text-xs text-ink-subtle lg:block">
          {placeSummary(date.location, date.venue, locale, t("coursesSessionVenueNone"))}
          <span aria-hidden="true"> · </span>
          <span className="tabular-nums">
            {t("coursesSessionDayCount", {count: entry.dayCount})}
          </span>
        </span>

        <span className="flex items-center gap-2 lg:justify-self-end">
          <span className="flex flex-col items-end gap-1">
            <span className="font-sans text-sm tabular-nums text-ink">
              <span aria-hidden="true">
                {entry.enrolments}/{entry.capacity}
              </span>
              <span className="sr-only">
                {t("coursesSessionSeats", {
                  taken: entry.enrolments,
                  capacity: entry.capacity,
                })}
              </span>
            </span>
            <SeatMeter
              ratio={occupancyRatio(entry.enrolments, entry.capacity)}
              label={t("coursesSessionSeats", {
                taken: entry.enrolments,
                capacity: entry.capacity,
              })}
            />
          </span>
          <ChevronDownIcon
            className={`text-ink-subtle transition-transform duration-150 ease-standard ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      <div id={panelId} hidden={!open}>
        {open ? (
          <SessionEditor
            courseId={courseId}
            entry={entry}
            locale={locale}
            onClose={() => onToggle(false)}
          />
        ) : null}
      </div>
    </li>
  );
}

function SeatMeter({ratio, label}: {ratio: number; label: string}) {
  const width = `${Math.round(ratio * 100)}%`;

  return (
    <span
      aria-hidden="true"
      title={label}
      className="block h-1 w-10 overflow-hidden rounded-panel border border-ink bg-white"
    >
      <span className="block h-full bg-ink" style={{width}} />
    </span>
  );
}

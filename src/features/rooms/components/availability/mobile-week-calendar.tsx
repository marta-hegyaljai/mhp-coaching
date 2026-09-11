"use client";

import {useState, type ReactNode} from "react";

import {formatDayHeading} from "@/shared/format/calendar-date";
import type {AppLocale} from "@/i18n/routing";

/** Switches between already-loaded week days instantly on a phone. */
export function MobileWeekCalendar({
  locale,
  days,
  initialDate,
  today,
  todayLabel,
  panels,
}: {
  locale: AppLocale;
  days: string[];
  initialDate: string;
  today: string;
  todayLabel: string;
  panels: Array<{date: string; content: ReactNode}>;
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const activeDate = days.includes(selectedDate) ? selectedDate : days[0];

  function selectDate(date: string) {
    setSelectedDate(date);
    const url = new URL(window.location.href);
    url.searchParams.set("date", date);
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="space-y-3">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist">
        {days.map((date) => {
          const selected = date === activeDate;
          const heading = formatDayHeading(date, locale);

          return (
            <button
              key={date}
              id={`room-day-tab-${date}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`room-day-${date}`}
              onClick={() => selectDate(date)}
              className={`flex min-h-14 min-w-14 shrink-0 flex-col items-center justify-center rounded-panel border px-2 transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                selected
                  ? "border-ink bg-ink text-parchment"
                  : "border-ink bg-white text-ink hover:bg-hover"
              }`}
            >
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.12em]">
                {heading.weekday}
              </span>
              <span className="font-sans text-base font-semibold tabular-nums leading-tight">
                {heading.day}
              </span>
              {date === today ? <span className="sr-only">{todayLabel}</span> : null}
            </button>
          );
        })}
      </div>
      {panels.map((panel) => (
        <div
          key={panel.date}
          id={`room-day-${panel.date}`}
          role="tabpanel"
          aria-labelledby={`room-day-tab-${panel.date}`}
          hidden={panel.date !== activeDate}
        >
          {panel.content}
        </div>
      ))}
    </div>
  );
}

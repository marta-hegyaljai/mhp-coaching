"use client";

import {useId, useState} from "react";
import {useTranslations} from "next-intl";

import {minutesToTime} from "@/features/rooms/timezone";
import {CALL_DURATION_MINUTES} from "@/features/course-calls/constants";
import type {CallHourInterval} from "@/features/course-calls/hours";

const WEEKDAY_KEYS = {
  1: "weekday1",
  2: "weekday2",
  3: "weekday3",
  4: "weekday4",
  5: "weekday5",
  6: "weekday6",
  7: "weekday7",
} as const;
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
const DEFAULT_START = 9 * 60;
const DEFAULT_END = 12 * 60;

type TimeOption = {value: number; label: string};

function timeOptions(): TimeOption[] {
  const options: TimeOption[] = [];
  for (let minute = 0; minute <= 1440; minute += CALL_DURATION_MINUTES) {
    options.push({value: minute, label: minutesToTime(minute)});
  }
  return options;
}

export function CallHoursEditor({hours}: {hours: CallHourInterval[]}) {
  const grouped = new Map<number, CallHourInterval[]>();
  for (const hour of hours) {
    const current = grouped.get(hour.weekday) ?? [];
    current.push(hour);
    grouped.set(hour.weekday, current);
  }

  return (
    <ul className="divide-y divide-line rounded-panel border border-ink bg-white">
      {WEEKDAYS.map((weekday) => (
        <WeekdayHours
          key={weekday}
          weekday={weekday}
          intervals={grouped.get(weekday) ?? []}
        />
      ))}
    </ul>
  );
}

function WeekdayHours({
  weekday,
  intervals,
}: {
  weekday: (typeof WEEKDAYS)[number];
  intervals: CallHourInterval[];
}) {
  const t = useTranslations("Admin");
  const [closed, setClosed] = useState(intervals.length === 0);
  const [rows, setRows] = useState(
    intervals.length > 0
      ? intervals.map((item) => ({
          startMinute: item.startMinute,
          endMinute: item.endMinute,
        }))
      : [{startMinute: DEFAULT_START, endMinute: DEFAULT_END}],
  );
  const checkboxId = useId();
  const times = timeOptions();

  return (
    <li className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center justify-between gap-4 sm:w-56 sm:pt-2">
          <span className="text-sm font-semibold text-ink">{t(WEEKDAY_KEYS[weekday])}</span>
          <label
            htmlFor={checkboxId}
            className="inline-flex min-h-11 items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-ink-muted"
          >
            <input
              id={checkboxId}
              type="checkbox"
              name={`closed-${weekday}`}
              checked={closed}
              onChange={(event) => setClosed(event.target.checked)}
              className="h-4 w-4 rounded-panel border-ink accent-ink"
            />
            {t("closedDay")}
          </label>
        </div>

        <div className={`min-w-0 flex-1 space-y-3 ${closed ? "opacity-40" : ""}`}>
          <input type="hidden" name={`count-${weekday}`} value={closed ? 0 : rows.length} />
          {rows.map((row, index) => (
            <div key={`${weekday}-${index}`} className="flex flex-wrap items-center gap-2">
              <TimeSelect
                name={`start-${weekday}-${index}`}
                label={`${t(WEEKDAY_KEYS[weekday])} — ${t("opens")} ${index + 1}`}
                value={row.startMinute}
                closed={closed}
                times={times}
                onChange={(startMinute) => {
                  setRows((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? {...item, startMinute} : item,
                    ),
                  );
                }}
              />
              <span aria-hidden className="text-sm text-ink-subtle">
                –
              </span>
              <TimeSelect
                name={`end-${weekday}-${index}`}
                label={`${t(WEEKDAY_KEYS[weekday])} — ${t("closes")} ${index + 1}`}
                value={row.endMinute}
                closed={closed}
                times={times}
                onChange={(endMinute) => {
                  setRows((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? {...item, endMinute} : item,
                    ),
                  );
                }}
              />
              {rows.length > 1 ? (
                <button
                  type="button"
                  disabled={closed}
                  onClick={() =>
                    setRows((current) => current.filter((_, itemIndex) => itemIndex !== index))
                  }
                  className="min-h-11 px-3 text-sm font-medium text-ink underline underline-offset-4 hover:text-ink-muted"
                >
                  {t("removeWindow")}
                </button>
              ) : null}
            </div>
          ))}
          {rows.length < 4 ? (
            <button
              type="button"
              disabled={closed}
              onClick={() =>
                setRows((current) => [
                  ...current,
                  {startMinute: 14 * 60, endMinute: 17 * 60},
                ])
              }
              className="min-h-11 text-sm font-medium text-ink underline underline-offset-4 hover:text-ink-muted"
            >
              {t("addWindow")}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function TimeSelect({
  name,
  label,
  value,
  closed,
  times,
  onChange,
}: {
  name: string;
  label: string;
  value: number;
  closed: boolean;
  times: TimeOption[];
  onChange: (value: number) => void;
}) {
  return (
    <select
      name={name}
      aria-label={label}
      aria-disabled={closed}
      tabIndex={closed ? -1 : 0}
      value={value}
      disabled={closed}
      onChange={(event) => onChange(Number(event.target.value))}
      className="min-h-11 rounded-panel border border-line bg-white px-3 font-sans text-sm tabular-nums text-ink outline-none focus:border-ink focus-visible:border-ink disabled:pointer-events-none"
    >
      {times.map((time) => (
        <option key={`${name}-${time.value}`} value={time.value}>
          {time.label}
        </option>
      ))}
    </select>
  );
}

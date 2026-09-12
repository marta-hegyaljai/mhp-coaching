"use client";

import {useId, useState} from "react";
import {useTranslations} from "next-intl";

import {minutesToTime} from "@/features/rooms/timezone";

export type TimeOption = {value: number; label: string};

export type OpeningHour = {weekday: number; startMinute: number; endMinute: number};

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

const DEFAULT_START = 7 * 60;
const DEFAULT_END = 21 * 60;

/** Every quarter hour, including 24:00 so a day can close at midnight. */
function timeOptions(interval: number): TimeOption[] {
  const options: TimeOption[] = [];

  for (let minute = 0; minute <= 1440; minute += Math.max(interval, 1)) {
    options.push({value: minute, label: minutesToTime(minute)});
  }

  return options;
}

function alignMinute(minute: number, interval: number): number {
  const step = Math.max(interval, 1);
  return Math.floor(minute / step) * step;
}

export function OpeningHoursEditor({
  hours,
  intervalMinutes,
}: {
  hours: OpeningHour[];
  intervalMinutes: number;
}) {
  const t = useTranslations("Rooms");
  const interval = intervalMinutes === 60 || intervalMinutes === 30 ? intervalMinutes : 15;
  const times = timeOptions(interval);
  const byWeekday = new Map(hours.map((item) => [item.weekday, item]));
  const revision = hours
    .map((hour) => `${hour.weekday}:${hour.startMinute}-${hour.endMinute}`)
    .join("|");

  return (
    <ul
      key={`${revision}:${interval}`}
      className="divide-y divide-line rounded-panel border border-ink bg-white"
    >
      {WEEKDAYS.map((weekday) => (
        <WeekdayRow
          key={weekday}
          weekday={weekday}
          current={byWeekday.get(weekday)}
          times={times}
          interval={interval}
          labels={{
            name: t(`weekday${weekday}`),
            closed: t("closedDay"),
            opens: t("opens"),
            closes: t("closes"),
          }}
        />
      ))}
    </ul>
  );
}

function WeekdayRow({
  weekday,
  current,
  times,
  interval,
  labels,
}: {
  weekday: number;
  current?: OpeningHour;
  times: TimeOption[];
  interval: number;
  labels: {name: string; closed: string; opens: string; closes: string};
}) {
  const [closed, setClosed] = useState(!current);
  const checkboxId = useId();
  const startValue = alignMinute(current?.startMinute ?? DEFAULT_START, interval);
  const endValue = alignMinute(current?.endMinute ?? DEFAULT_END, interval);

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center justify-between gap-4 sm:w-56">
        <span className="text-sm font-semibold text-ink">{labels.name}</span>
        <label
          htmlFor={checkboxId}
          className="inline-flex min-h-11 items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-ink-muted"
        >
          <input
            id={checkboxId}
            type="checkbox"
            name={`closed-${weekday}`}
            defaultChecked={!current}
            onChange={(event) => setClosed(event.target.checked)}
            className="h-4 w-4 rounded-panel border-ink accent-ink"
          />
          {labels.closed}
        </label>
      </div>

      <div
        className={`flex items-center gap-2 transition-opacity duration-150 ease-standard ${
          closed ? "opacity-40" : ""
        }`}
      >
        <TimeSelect
          name={`start-${weekday}`}
          label={`${labels.name} — ${labels.opens}`}
          defaultValue={startValue}
          closed={closed}
          times={times}
          idPrefix={`s-${weekday}`}
        />
        <span aria-hidden className="text-sm text-ink-subtle">
          –
        </span>
        <TimeSelect
          name={`end-${weekday}`}
          label={`${labels.name} — ${labels.closes}`}
          defaultValue={endValue}
          closed={closed}
          times={times}
          idPrefix={`e-${weekday}`}
        />
      </div>
    </li>
  );
}

function TimeSelect({
  name,
  label,
  defaultValue,
  closed,
  times,
  idPrefix,
}: {
  name: string;
  label: string;
  defaultValue: number;
  closed: boolean;
  times: TimeOption[];
  idPrefix: string;
}) {
  return (
    <select
      name={name}
      aria-label={label}
      aria-disabled={closed}
      tabIndex={closed ? -1 : 0}
      defaultValue={defaultValue}
      className={`min-h-11 rounded-panel border border-line bg-white px-3 font-sans text-sm tabular-nums text-ink outline-none focus:border-ink focus-visible:border-ink ${
        closed ? "pointer-events-none" : ""
      }`}
    >
      {times.map((time) => (
        <option key={`${idPrefix}-${time.value}`} value={time.value}>
          {time.label}
        </option>
      ))}
    </select>
  );
}

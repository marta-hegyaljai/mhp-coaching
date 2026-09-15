"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {createPortal} from "react-dom";
import {useLocale, useTranslations} from "next-intl";

import {formatLongDate, formatMonthYear, formatWeekdayDate} from "@/shared/format/calendar-date";
import {intlLocale} from "@/i18n/intl-locale";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {
  isIsoDate,
  isIsoInRange,
  monthWeeks,
  parseIsoDate,
  shiftMonth,
  todayIsoInZurich,
  toIsoDate,
  yearsInRange,
} from "@/shared/ui/date-field-calendar";
import {fieldLabelClass, fieldStyles, type FieldSize} from "@/shared/ui/field";
import {CalendarIcon, ChevronLeftIcon, ChevronRightIcon} from "@/shared/ui/icons";

type DateFieldProps = {
  id: string;
  name: string;
  label?: string;
  "aria-label"?: string;
  help?: ReactNode;
  error?: string;
  size?: FieldSize;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: string;
  value?: string;
  min?: string;
  max?: string;
  /** Month shown first when the field is empty. */
  initialView?: string;
  fieldClassName?: string;
};

export function DateField({
  id,
  name,
  label,
  "aria-label": ariaLabel,
  help,
  error,
  size = "md",
  required = false,
  disabled = false,
  defaultValue = "",
  value,
  min,
  max,
  initialView,
  fieldClassName = "",
}: DateFieldProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("DateField");
  const initial = isIsoDate(value ?? defaultValue) ? (value ?? defaultValue) : "";
  const [selected, setSelected] = useState(initial);
  const selectedDate = value !== undefined ? (isIsoDate(value) ? value : "") : selected;
  const parsed =
    parseIsoDate(selectedDate) ??
    parseIsoDate(initialView ?? "") ??
    parseIsoDate(todayIsoInZurich());
  const [cursor, setCursor] = useState({
    year: parsed?.year ?? 2026,
    month: parsed?.month ?? 0,
  });
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;
  const labelText = label ?? ariaLabel ?? t("calendar");

  useEffect(() => {
    if (!open) {
      return;
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || document.getElementById(`${id}-calendar`)?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [id, open]);

  function commit(next: string) {
    setSelected(next);
    const input = valueRef.current;
    if (input) {
      input.value = next;
      input.dispatchEvent(new Event("input", {bubbles: true}));
      input.dispatchEvent(new Event("change", {bubbles: true}));
    }
  }

  function pick(iso: string) {
    if (!isIsoInRange(iso, min, max)) {
      return;
    }
    commit(iso);
    setOpen(false);
    triggerRef.current?.focus();
  }

  const control = (
    <DateControl
      id={id}
      name={name}
      locale={locale}
      label={labelText}
      describedBy={describedBy}
      error={Boolean(error)}
      size={size}
      required={required}
      disabled={disabled}
      selected={selectedDate}
      min={min}
      max={max}
      open={open}
      cursor={cursor}
      triggerRef={triggerRef}
      valueRef={valueRef}
      calendarId={`${id}-calendar`}
      onToggle={() => {
        if (disabled) {
          return;
        }
        if (!open) {
          const next =
            parseIsoDate(selectedDate) ??
            parseIsoDate(initialView ?? "") ??
            parseIsoDate(todayIsoInZurich());
          if (next) {
            setCursor({year: next.year, month: next.month});
          }
        }
        setOpen((current) => !current);
      }}
      onCursorChange={setCursor}
      onPick={pick}
      onClear={
        required
          ? undefined
          : () => {
              commit("");
              setOpen(false);
            }
      }
    />
  );

  if (!label) {
    return <div ref={rootRef} className={fieldClassName}>{control}</div>;
  }

  return (
    <div ref={rootRef} className={fieldClassName}>
      <label htmlFor={id} className={fieldLabelClass}>
        {label}
      </label>
      <div className="mt-2">{control}</div>
      {help ? (
        <p id={helpId} className="mt-2 text-sm leading-6 text-ink-muted">
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function DateControl({
  id,
  name,
  locale,
  label,
  describedBy,
  error,
  size,
  required,
  disabled,
  selected,
  min,
  max,
  open,
  cursor,
  triggerRef,
  valueRef,
  calendarId,
  onToggle,
  onCursorChange,
  onPick,
  onClear,
}: {
  id: string;
  name: string;
  locale: AppLocale;
  label: string;
  describedBy?: string;
  error: boolean;
  size: FieldSize;
  required: boolean;
  disabled: boolean;
  selected: string;
  min?: string;
  max?: string;
  open: boolean;
  cursor: {year: number; month: number};
  triggerRef: RefObject<HTMLButtonElement | null>;
  valueRef: RefObject<HTMLInputElement | null>;
  calendarId: string;
  onToggle: () => void;
  onCursorChange: (cursor: {year: number; month: number}) => void;
  onPick: (iso: string) => void;
  onClear?: () => void;
}) {
  const t = useTranslations("DateField");
  const today = todayIsoInZurich();
  const weeks = useMemo(
    () => monthWeeks(cursor.year, cursor.month),
    [cursor.month, cursor.year],
  );
  const weekdays = useMemo(() => weekdayHeadings(locale), [locale]);
  const monthLabel = formatMonthYear(toIsoDate(cursor.year, cursor.month, 1), locale);
  const years = useMemo(
    () => yearsInRange(min, max, cursor.year),
    [cursor.year, max, min],
  );

  return (
    <div className="relative">
      <input
        ref={valueRef}
        type="text"
        name={name}
        value={selected}
        required={required}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={() => undefined}
        onInvalid={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
        }}
      />
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? calendarId : undefined}
        aria-label={label}
        aria-describedby={describedBy}
        aria-invalid={error || undefined}
        aria-required={required || undefined}
        onClick={onToggle}
        className={`${fieldStyles({size, numeric: true, invalid: error})} flex items-center justify-between gap-3 text-left ${
          open ? "border-ink" : ""
        }`}
      >
        <span className={selected ? "text-ink" : "text-ink-subtle"}>
          {selected ? formatLongDate(selected, locale) : t("empty")}
        </span>
        <CalendarIcon className="text-ink-subtle" />
      </button>
      {open
        ? createPortal(
            <DatePickerDialog
              id={calendarId}
              locale={locale}
              label={t("calendar")}
              monthLabel={monthLabel}
              weekdays={weekdays}
              weeks={weeks}
              selected={selected}
              today={today}
              min={min}
              max={max}
              cursor={cursor}
              years={years}
              triggerRef={triggerRef}
              onCursorChange={onCursorChange}
              onPick={onPick}
              onToday={() => onPick(today)}
              onClear={onClear}
            />,
            document.body,
          )
        : null}
    </div>
  );
}

function DatePickerDialog({
  id,
  locale,
  label,
  monthLabel,
  weekdays,
  weeks,
  selected,
  today,
  min,
  max,
  cursor,
  years,
  triggerRef,
  onCursorChange,
  onPick,
  onToday,
  onClear,
}: {
  id: string;
  locale: AppLocale;
  label: string;
  monthLabel: string;
  weekdays: string[];
  weeks: Array<Array<string | null>>;
  selected: string;
  today: string;
  min?: string;
  max?: string;
  cursor: {year: number; month: number};
  years: number[];
  triggerRef: RefObject<HTMLButtonElement | null>;
  onCursorChange: (cursor: {year: number; month: number}) => void;
  onPick: (iso: string) => void;
  onToday: () => void;
  onClear?: () => void;
}) {
  const t = useTranslations("DateField");
  const [position, setPosition] = useState({top: 0, left: 0});
  const todayEnabled = isIsoInRange(today, min, max);
  const showFooter = todayEnabled || Boolean(onClear);

  useLayoutEffect(() => {
    function update() {
      setPosition(popoverPosition(triggerRef.current));
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [triggerRef]);

  return (
    <div
      id={id}
      role="dialog"
      aria-label={label}
      className="fixed z-50 w-[20.5rem] max-w-[calc(100vw-2rem)] rounded-panel border border-ink bg-white p-3"
      style={{top: position.top, left: position.left}}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onCursorChange(shiftMonth(cursor.year, cursor.month, -1))}
          aria-label={t("previousMonth")}
          className="flex size-11 items-center justify-center rounded-panel border border-line text-ink transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <ChevronLeftIcon />
        </button>
        <p className="min-w-0 text-center text-sm font-semibold capitalize">{monthLabel}</p>
        <button
          type="button"
          onClick={() => onCursorChange(shiftMonth(cursor.year, cursor.month, 1))}
          aria-label={t("nextMonth")}
          className="flex size-11 items-center justify-center rounded-panel border border-line text-ink transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <select
          aria-label={t("month")}
          value={cursor.month}
          onChange={(event) =>
            onCursorChange({year: cursor.year, month: Number(event.target.value)})
          }
          className={`${fieldStyles({size: "sm"})} py-0`}
        >
          {monthNames(locale).map((name, month) => (
            <option key={name} value={month}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label={t("year")}
          value={cursor.year}
          onChange={(event) =>
            onCursorChange({year: Number(event.target.value), month: cursor.month})
          }
          className={`${fieldStyles({size: "sm", numeric: true})} py-0`}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 grid grid-cols-7">
        {weekdays.map((weekday, index) => (
          <p
            key={index}
            className="flex h-8 items-center justify-center text-[0.65rem] font-bold uppercase tracking-[0.08em] text-ink-subtle"
          >
            {weekday}
          </p>
        ))}
        {weeks.flat().map((iso, index) => {
          if (!iso) {
            return <span key={`empty-${index}`} aria-hidden="true" className="min-h-11" />;
          }

          const enabled = isIsoInRange(iso, min, max);
          const isSelected = iso === selected;
          const isToday = iso === today;

          return (
            <button
              key={iso}
              type="button"
              disabled={!enabled}
              aria-label={formatWeekdayDate(iso, locale)}
              aria-pressed={isSelected}
              onClick={() => onPick(iso)}
              className={`flex min-h-11 items-center justify-center rounded-panel font-sans text-sm tabular-nums transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-35 ${
                isSelected
                  ? "bg-ink text-parchment"
                  : isToday
                    ? "border border-ink hover:bg-hover"
                    : "hover:bg-hover"
              }`}
            >
              {Number(iso.slice(8, 10))}
            </button>
          );
        })}
      </div>

      {showFooter ? (
        <div className="mt-3 flex gap-2 border-t border-line-soft pt-3">
          {todayEnabled ? (
            <button
              type="button"
              onClick={onToday}
              className={`${buttonStyles({variant: "secondary", size: "md"})} flex-1`}
            >
              {t("today")}
            </button>
          ) : null}
          {onClear ? (
            <button type="button" onClick={onClear} className={`${buttonStyles({variant: "quiet", size: "md"})} flex-1`}>
              {t("clear")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function popoverPosition(trigger: HTMLButtonElement | null): {top: number; left: number} {
  if (!trigger || typeof window === "undefined") {
    return {top: 16, left: 16};
  }

  const rect = trigger.getBoundingClientRect();
  const width = Math.min(328, window.innerWidth - 32);
  const estimatedHeight = 460;
  const left = Math.max(16, Math.min(rect.left, window.innerWidth - width - 16));
  const below = rect.bottom + 8;
  const top =
    below + estimatedHeight <= window.innerHeight - 16 || rect.top < estimatedHeight + 24
      ? below
      : Math.max(16, rect.top - estimatedHeight - 8);

  return {top, left};
}

function weekdayHeadings(locale: AppLocale): string[] {
  const formatter = new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: "narrow",
    timeZone: "UTC",
  });

  return Array.from({length: 7}, (_, index) => {
    // 5 January 2026 is a Monday.
    return formatter.format(new Date(Date.UTC(2026, 0, 5 + index)));
  });
}

function monthNames(locale: AppLocale): string[] {
  const formatter = new Intl.DateTimeFormat(intlLocale(locale), {
    month: "long",
    timeZone: "UTC",
  });

  return Array.from({length: 12}, (_, month) =>
    formatter.format(new Date(Date.UTC(2026, month, 1))),
  );
}

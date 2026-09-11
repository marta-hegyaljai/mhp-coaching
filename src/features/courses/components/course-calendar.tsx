"use client";

import {useMemo, useState} from "react";

import {sessionsOnDate, type CalendarSession} from "@/features/courses/calendar";
import {
  firstIsoInMonth,
  monthWeeks,
  sessionBarLabel,
  sessionBarsForWeek,
  sessionKey,
  sessionOccupiesIso,
  sessionRangeEnd,
} from "@/features/courses/calendar-layout";
import {todayIsoInZurich} from "@/features/courses/dates";
import {intlLocale} from "@/i18n/intl-locale";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon, CalendarIcon} from "@/shared/ui/icons";
import {Price} from "@/shared/ui/price";

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export type CourseCalendarLabels = {
  previousMonth: string;
  nextMonth: string;
  emptyDay: string;
  sessionsOnDay: string;
  book: string;
  caption: string;
  weekday: Record<(typeof WEEKDAY_KEYS)[number], string>;
};

export function CourseCalendar({
  locale,
  sessions,
  labels,
}: {
  locale: AppLocale;
  sessions: CalendarSession[];
  labels: CourseCalendarLabels;
}) {
  const today = todayIsoInZurich();
  const firstSession = sessions
    .map((session) => session.startDate)
    .sort()[0];
  const initial = parseYearMonth(firstSession && firstSession > today ? firstSession : today);
  const [cursor, setCursor] = useState(initial);
  const [selectedDay, setSelectedDay] = useState(
    firstSession && firstSession >= today ? firstSession : today,
  );
  const [selectedSession, setSelectedSession] = useState<string | null>(
    firstSession ? sessionKeyForDate(sessions, firstSession) : null,
  );

  const weeks = useMemo(
    () => monthWeeks(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );
  const monthLabel = new Intl.DateTimeFormat(intlLocale(locale), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(cursor.year, cursor.month, 1)));
  const selectedSessions = sessionsOnDate(sessions, selectedDay);
  const highlighted = selectedSessions.find(
    (session) => sessionKey(session) === selectedSession,
  );

  function shiftMonth(delta: number) {
    const date = new Date(Date.UTC(cursor.year, cursor.month + delta, 1));
    const next = {year: date.getUTCFullYear(), month: date.getUTCMonth()};
    setCursor(next);

    const current = sessions.find((session) => sessionKey(session) === selectedSession);
    const keepIso = current ? firstIsoInMonth(current, next.year, next.month) : null;
    if (keepIso) {
      setSelectedDay(keepIso);
      return;
    }

    const fallback = sessions
      .map((session) => ({
        session,
        iso: firstIsoInMonth(session, next.year, next.month),
      }))
      .find((entry) => entry.iso);

    if (fallback?.iso) {
      setSelectedDay(fallback.iso);
      setSelectedSession(sessionKey(fallback.session));
    }
  }

  function selectDay(iso: string) {
    setSelectedDay(iso);
    const onDay = sessionsOnDate(sessions, iso);
    const keep =
      selectedSession && onDay.some((session) => sessionKey(session) === selectedSession);
    setSelectedSession(keep ? selectedSession : onDay[0] ? sessionKey(onDay[0]) : null);
  }

  function selectBar(iso: string, key: string) {
    setSelectedDay(iso);
    setSelectedSession(key);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
      <div className="border border-ink bg-white p-3 sm:p-5 lg:col-span-7">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className={`${buttonStyles({variant: "quiet"})} min-h-11 shrink-0 px-1 text-xs font-bold uppercase tracking-[0.08em] sm:px-2`}
          >
            {labels.previousMonth}
          </button>
          <p className="min-w-0 text-center font-serif text-subheading capitalize">
            {monthLabel}
          </p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className={`${buttonStyles({variant: "quiet"})} min-h-11 shrink-0 px-1 text-xs font-bold uppercase tracking-[0.08em] sm:px-2`}
          >
            {labels.nextMonth}
          </button>
        </div>
        <p className="mt-3 text-[0.7rem] leading-5 text-ink-subtle">{labels.caption}</p>

        <div role="grid" aria-label={monthLabel} className="mt-4">
          <div role="row" className="grid grid-cols-7">
            {WEEKDAY_KEYS.map((key) => (
              <div
                key={key}
                role="columnheader"
                className="pb-2 text-center text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink-subtle"
              >
                {labels.weekday[key]}
              </div>
            ))}
          </div>

          {weeks.map((week, weekIndex) => {
            const bars = sessionBarsForWeek(week, sessions);
            const laneCount = bars.reduce((max, bar) => Math.max(max, bar.lane + 1), 0);

            return (
              <div key={weekIndex} className="border-t border-line-soft pt-1">
                <div role="row" className="grid grid-cols-7">
                  {week.map((iso, dayIndex) => {
                    if (!iso) {
                      return <div key={`empty-${weekIndex}-${dayIndex}`} />;
                    }

                    const daySessions = sessionsOnDate(sessions, iso);
                    const hasSessions = daySessions.length > 0;
                    const isSelected = iso === selectedDay;
                    const inHighlighted =
                      Boolean(highlighted) && sessionOccupiesIso(highlighted!, iso);
                    const isRangeStart =
                      inHighlighted && highlighted?.startDate === iso;
                    const isRangeEnd =
                      inHighlighted &&
                      highlighted !== undefined &&
                      sessionRangeEnd(highlighted) === iso;

                    return (
                      <div key={iso} role="gridcell">
                        <button
                          type="button"
                          onClick={() => selectDay(iso)}
                          disabled={!hasSessions}
                          aria-pressed={isSelected}
                          aria-label={dayAriaLabel(iso, daySessions)}
                          className={`flex min-h-11 w-full flex-col items-center justify-center text-sm tabular-nums transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                            isSelected
                              ? "bg-ink text-parchment"
                              : inHighlighted
                                ? "bg-hover text-ink"
                                : hasSessions
                                  ? "text-ink hover:bg-hover"
                                  : "text-ink-subtle"
                          } ${iso === today && !isSelected ? "font-semibold" : ""} ${
                            isRangeStart && !isSelected ? "border-l border-ink" : ""
                          } ${isRangeEnd && !isSelected ? "border-r border-ink" : ""}`}
                        >
                          {Number(iso.slice(8, 10))}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {laneCount > 0 ? (
                  <div
                    className="grid grid-cols-7"
                    style={{
                      gridTemplateRows: `repeat(${laneCount}, minmax(2.75rem, auto))`,
                    }}
                  >
                    {bars.map((bar) => {
                      const iso = week[bar.startCol];
                      if (!iso) {
                        return null;
                      }
                      const key = sessionKey(bar.session);
                      const isActive = key === selectedSession;
                      const label = sessionBarLabel(bar);

                      return (
                        <button
                          key={bar.key}
                          type="button"
                          onClick={() => selectBar(iso, key)}
                          aria-pressed={isActive}
                          aria-label={`${bar.session.title}, ${bar.session.dateLabel}`}
                          title={label}
                          style={{
                            gridColumn: `${bar.startCol + 1} / span ${bar.span}`,
                            gridRow: bar.lane + 1,
                          }}
                          className={`flex min-h-11 items-center overflow-hidden px-1.5 text-left text-[0.58rem] leading-tight font-medium tracking-tight transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:px-2 sm:text-[0.65rem] ${
                            isActive
                              ? "bg-ink text-parchment"
                              : "border-y border-ink bg-white text-ink hover:bg-hover"
                          } ${
                            bar.continuesBefore
                              ? "border-l-0"
                              : "border-l-2 border-l-ink"
                          } ${
                            bar.continuesAfter
                              ? "border-r-0"
                              : "border-r-2 border-r-ink"
                          }`}
                        >
                          <span className="min-w-0 truncate">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-1.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-5">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-gold-deep">
          {labels.sessionsOnDay}
        </p>
        {selectedSessions.length === 0 ? (
          <p className="mt-3 text-sm leading-7 text-ink-muted">{labels.emptyDay}</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {selectedSessions.map((session) => {
              const key = sessionKey(session);
              const isActive = key === selectedSession;

              return (
                <li key={key}>
                  <article
                    className={`flex h-full flex-col justify-between gap-4 border bg-parchment p-4 ${
                      isActive ? "border-ink" : "border-line"
                    }`}
                  >
                    <div>
                      <p className="font-serif text-subheading">{session.title}</p>
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {session.dateLabel}
                      </p>
                      <p className="mt-1 text-sm text-ink-subtle">
                        {session.location} · {session.duration}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <Price size="sm">{session.priceLabel}</Price>
                      <Link
                        href={{
                          pathname: "/courses/[slug]/book",
                          params: {slug: session.slug},
                          query: {date: session.dateId},
                        }}
                        className={buttonStyles({
                          variant: isActive ? "primary" : "secondary",
                        })}
                      >
                        {labels.book}
                        <ArrowRightIcon className="transition-transform duration-150 ease-standard group-hover/button:translate-x-1" />
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function sessionKeyForDate(sessions: CalendarSession[], iso: string): string | null {
  const onDay = sessionsOnDate(sessions, iso);
  return onDay[0] ? sessionKey(onDay[0]) : null;
}

function dayAriaLabel(iso: string, daySessions: CalendarSession[]): string {
  if (daySessions.length === 0) {
    return iso;
  }

  return `${iso}, ${daySessions.map((session) => session.title).join(", ")}`;
}

function parseYearMonth(isoDate: string): {year: number; month: number} {
  return {
    year: Number(isoDate.slice(0, 4)),
    month: Number(isoDate.slice(5, 7)) - 1,
  };
}

"use client";

import Image from "next/image";
import {useMemo, useState} from "react";
import type {ReactNode} from "react";

import {CourseCalendar} from "@/features/courses/components/course-calendar";
import {CourseCard} from "@/features/courses/components/course-card";
import {CATALOGUE_INSTRUCTOR_IMAGE} from "@/features/courses/components/course-catalogue-masthead";
import {
  toCalendarSession,
  type CalendarSession,
} from "@/features/courses/calendar";
import {occupiedMonthKeys} from "@/features/courses/calendar-layout";
import {getBookableDates} from "@/features/courses/queries";
import type {Course} from "@/features/courses/types";
import type {AppLocale} from "@/i18n/routing";
import {SearchIcon} from "@/shared/ui/icons";

type ViewMode = "grid" | "calendar";

type ExplorerLabels = {
  search: string;
  searchPlaceholder: string;
  month: string;
  allMonths: string;
  gridView: string;
  calendarView: string;
  noResults: string;
  previousMonth: string;
  nextMonth: string;
  emptyDay: string;
  sessionsOnDay: string;
  caption: string;
  awaitingDateLabel: string;
  book: string;
  weekday: {
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
    sun: string;
  };
};

export function CourseExplorer({
  locale,
  groups,
  detailsLabel,
  labels,
  lead,
  portrait,
  portraitAlt,
  initialView = "grid",
}: {
  locale: AppLocale;
  groups: Array<{title: string; courses: Course[]}>;
  detailsLabel: string;
  labels: ExplorerLabels;
  lead?: ReactNode;
  portrait?: ReactNode;
  portraitAlt?: string;
  initialView?: ViewMode;
}) {
  const allCourses = groups.flatMap((group) => group.courses);
  const sessions = useMemo(
    () =>
      allCourses.flatMap((course) =>
        getBookableDates(course).map((date) => toCalendarSession(course, date, locale)),
      ),
    [allCourses, locale],
  );
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("");
  const [view, setView] = useState<ViewMode>(
    initialView === "calendar" ? "calendar" : "grid",
  );

  const months = useMemo(() => uniqueMonths(sessions, locale), [sessions, locale]);
  const filteredCourses = allCourses.filter((course) =>
    matchesFilters(course, locale, query, month),
  );
  const filteredIds = new Set(filteredCourses.map((course) => course.id));
  const filteredSessions = sessions.filter((session) => {
    if (!filteredIds.has(session.courseId)) {
      return false;
    }
    if (!month) {
      return true;
    }
    return occupiesMonth(session, month);
  });
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      courses: group.courses.filter((course) => filteredIds.has(course.id)),
    }))
    .filter((group) => group.courses.length > 0);

  const toolbar = (
      <div className="grid gap-3 border border-ink bg-white p-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end">
        <div>
          <label htmlFor="course-search" className="block text-sm font-medium text-ink">
            {labels.search}
          </label>
          <div className="relative mt-2">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input
              id="course-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.searchPlaceholder}
              className="block min-h-11 w-full rounded-panel border border-line bg-white py-2 pr-3 pl-10 text-base text-ink placeholder:text-ink-subtle focus:border-ink focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label htmlFor="course-month" className="block text-sm font-medium text-ink">
            {labels.month}
          </label>
          <select
            id="course-month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="mt-2 block min-h-11 w-full rounded-panel border border-line bg-white px-3 text-base text-ink focus:border-ink focus:outline-none"
          >
            <option value="">{labels.allMonths}</option>
            {months.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div
          role="group"
          aria-label={labels.calendarView}
          className="grid grid-cols-2 self-end border border-ink"
        >
          <ViewButton
            pressed={view === "grid"}
            onClick={() => setView("grid")}
          >
            {labels.gridView}
          </ViewButton>
          <ViewButton
            pressed={view === "calendar"}
            onClick={() => setView("calendar")}
          >
            {labels.calendarView}
          </ViewButton>
        </div>
      </div>
  );

  return (
    <div>
      {lead && portrait ? (
        <div className="mt-8 grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-stretch lg:gap-x-10 lg:gap-y-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="relative isolate overflow-hidden rounded-panel border border-ink lg:overflow-visible lg:rounded-none lg:border-0">
            <div className="relative z-10 flex min-h-52 flex-col justify-end p-5 sm:min-h-56 sm:p-6 lg:min-h-0 lg:justify-start lg:p-0">
              {lead}
            </div>
            {portraitAlt ? (
              <div className="absolute inset-0 -z-10 lg:hidden">
                <Image
                  src={CATALOGUE_INSTRUCTOR_IMAGE}
                  alt={portraitAlt}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover object-[62%_18%]"
                />
                <div className="absolute inset-0 bg-black/45" />
              </div>
            ) : null}
          </div>
          <div className="hidden lg:row-span-2 lg:block">{portrait}</div>
          <div className="mt-6 lg:mt-0">{toolbar}</div>
        </div>
      ) : (
        toolbar
      )}

      {filteredCourses.length === 0 ? (
        <p className="mt-8 text-sm leading-7 text-ink-muted">{labels.noResults}</p>
      ) : view === "calendar" ? (
        <div className="mt-8">
          <CourseCalendar
            locale={locale}
            sessions={filteredSessions}
            labels={labels}
          />
        </div>
      ) : (
        <div className="mt-4">
          {visibleGroups.map((group) => (
            <section key={group.title} className="mt-10 first:mt-8">
              <div className="flex items-baseline justify-between gap-4 border-b border-ink/15 pb-3">
                <h2 className="font-serif text-subheading">{group.title}</h2>
                <p className="text-xs uppercase tracking-[0.16em] text-ink-subtle">
                  {group.courses.length}
                </p>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    locale={locale}
                    detailsLabel={detailsLabel}
                    awaitingDateLabel={labels.awaitingDateLabel}
                    headingLevel="h3"
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ViewButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-11 px-3 text-sm font-semibold tracking-[0.02em] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink ${
        pressed ? "bg-ink text-parchment" : "bg-white text-ink hover:bg-hover"
      }`}
    >
      {children}
    </button>
  );
}

function matchesFilters(
  course: Course,
  locale: AppLocale,
  query: string,
  month: string,
): boolean {
  const needle = query.trim().toLowerCase();
  const textMatch =
    needle.length === 0 ||
    course.title[locale].toLowerCase().includes(needle) ||
    course.shortDescription[locale].toLowerCase().includes(needle);

  if (!textMatch) {
    return false;
  }

  if (!month) {
    return true;
  }

  return getBookableDates(course).some((date) => occupiesMonth(date, month));
}

function occupiesMonth(
  date: Pick<CalendarSession, "startDate" | "endDate">,
  month: string,
): boolean {
  const rangeStart = `${month}-01`;
  const rangeEnd = `${month}-31`;
  const last = date.endDate && date.endDate > date.startDate ? date.endDate : date.startDate;
  return date.startDate <= rangeEnd && last >= rangeStart;
}

function uniqueMonths(
  sessions: CalendarSession[],
  locale: AppLocale,
): Array<{value: string; label: string}> {
  const keys = [...new Set(sessions.flatMap(occupiedMonthKeys))].sort();
  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : `${locale}-CH`, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return keys.map((value) => ({
    value,
    label: formatter.format(new Date(`${value}-01T12:00:00Z`)),
  }));
}

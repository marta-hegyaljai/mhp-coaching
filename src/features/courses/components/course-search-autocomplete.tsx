"use client";

import {useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent} from "react";

import {CourseArtwork} from "@/features/courses/components/course-artwork";
import {formatCourseDateRange} from "@/features/courses/dates";
import {filterCoursesForSearch} from "@/features/courses/course-search";
import {getBookableDates} from "@/features/courses/queries";
import {isProgrammeCourse, type Course, type CourseCategory} from "@/features/courses/types";
import {formatChf} from "@/features/payments/money";
import {Link, useRouter} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {controlFocusClass} from "@/shared/ui/field";
import {ArrowRightIcon, SearchIcon} from "@/shared/ui/icons";

type SearchLabels = {
  search: string;
  searchPlaceholder: string;
  suggestions: string;
  browseAll: string;
  noSuggestions: string;
  awaitingDateLabel: string;
  viewCourse: string;
  /** Replaces the category label for bundled paths. */
  programme?: string;
};

export function CourseSearchAutocomplete({
  locale,
  courses,
  categoryLabels,
  query,
  month,
  onQueryChange,
  labels,
}: {
  locale: AppLocale;
  courses: readonly Course[];
  categoryLabels: Record<CourseCategory, string>;
  query: string;
  month: string;
  onQueryChange: (value: string) => void;
  labels: SearchLabels;
}) {
  const router = useRouter();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [filterSnapshot, setFilterSnapshot] = useState({query, month});

  const suggestions = useMemo(
    () => filterCoursesForSearch(courses, locale, query, month),
    [courses, locale, query, month],
  );

  const panelHeading = query.trim() ? labels.suggestions : labels.browseAll;

  if (filterSnapshot.query !== query || filterSnapshot.month !== month) {
    setFilterSnapshot({query, month});
    setActiveCourseId(null);
  }

  const activeIndex = useMemo(() => {
    if (suggestions.length === 0) {
      return -1;
    }

    if (activeCourseId) {
      const found = suggestions.findIndex((course) => course.id === activeCourseId);
      if (found >= 0) {
        return found;
      }
    }

    return 0;
  }, [activeCourseId, suggestions]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0) {
      return;
    }

    rootRef.current
      ?.querySelector(`[data-suggestion-index="${activeIndex}"]`)
      ?.scrollIntoView({block: "nearest"});
  }, [activeIndex, isOpen]);

  function openPanel() {
    setIsOpen(true);
  }

  function closePanel() {
    setIsOpen(false);
  }

  function courseHref(course: Course) {
    return {
      pathname: "/courses/[slug]" as const,
      params: {slug: course.slug[locale]},
    };
  }

  function selectCourse(course: Course) {
    closePanel();
    router.push(courseHref(course));
  }

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      openPanel();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = Math.min(activeIndex + 1, suggestions.length - 1);
      setActiveCourseId(suggestions[next]?.id ?? null);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = Math.max(activeIndex - 1, 0);
      setActiveCourseId(suggestions[next]?.id ?? null);
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault();
      selectCourse(suggestions[activeIndex]!);
    }
  }

  return (
    <div ref={rootRef}>
      <label htmlFor="course-search" className="block text-sm font-medium text-ink">
        {labels.search}
      </label>
      <div
        className={`relative mt-2 rounded-panel border bg-white transition-colors duration-150 ${
          isOpen ? "border-ink" : "border-line focus-within:border-ink"
        }`}
      >
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <input
            ref={inputRef}
            id="course-search"
            type="search"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={
              isOpen && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
            }
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onFocus={openPanel}
            onKeyDown={onInputKeyDown}
            placeholder={labels.searchPlaceholder}
            className={`block min-h-11 w-full rounded-panel bg-transparent py-2 pr-3 pl-10 text-base text-ink placeholder:text-ink-subtle ${controlFocusClass}`}
          />
        </div>

        {isOpen ? (
          <div className="border-t border-line-soft">
            <p className="px-3 pt-3 pb-1 text-[0.65rem] font-bold tracking-[0.18em] text-ink-subtle uppercase">
              {panelHeading}
            </p>
            {suggestions.length === 0 ? (
              <p className="px-3 pb-4 text-sm leading-6 text-ink-muted">{labels.noSuggestions}</p>
            ) : (
              <ul
                id={listboxId}
                role="listbox"
                aria-label={labels.suggestions}
                className="max-h-[min(24rem,60vh)] overflow-y-auto overscroll-contain pb-1"
              >
                {suggestions.map((course, index) => (
                  <li key={course.id} role="presentation">
                    <SuggestionRow
                      course={course}
                      locale={locale}
                      categoryLabel={
                        labels.programme && isProgrammeCourse(course)
                          ? labels.programme
                          : categoryLabels[course.category]
                      }
                      index={index}
                      listboxId={listboxId}
                      active={index === activeIndex}
                      awaitingDateLabel={labels.awaitingDateLabel}
                      viewCourseLabel={labels.viewCourse}
                      href={courseHref(course)}
                      onHover={() => setActiveCourseId(course.id)}
                      onNavigate={closePanel}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SuggestionRow({
  course,
  locale,
  categoryLabel,
  index,
  listboxId,
  active,
  awaitingDateLabel,
  viewCourseLabel,
  href,
  onHover,
  onNavigate,
}: {
  course: Course;
  locale: AppLocale;
  categoryLabel: string;
  index: number;
  listboxId: string;
  active: boolean;
  awaitingDateLabel: string;
  viewCourseLabel: string;
  href: {pathname: "/courses/[slug]"; params: {slug: string}};
  onHover: () => void;
  onNavigate: () => void;
}) {
  const dates = getBookableDates(course);
  const nextDate = dates[0] ? formatCourseDateRange(dates[0], locale) : awaitingDateLabel;
  const price = formatChf(course.priceChf, locale, {compact: true});

  return (
    <Link
      id={`${listboxId}-option-${index}`}
      href={href}
      role="option"
      aria-selected={active}
      data-suggestion-index={index}
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onNavigate}
      className={`group/suggestion flex gap-3 border-b border-line-soft px-3 py-3 transition-[background-color,transform] duration-150 last:border-b-0 hover:-translate-y-0.5 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink motion-reduce:transform-none ${
        active ? "bg-hover" : ""
      }`}
    >
      <div className="group/card relative h-16 w-16 shrink-0 overflow-hidden border border-line bg-white">
        <CourseArtwork course={course} sizes="64px" interactive />
      </div>

      <span className="min-w-0 flex-1">
        <span className="block text-[0.65rem] font-bold tracking-[0.18em] text-gold-deep uppercase">
          {categoryLabel} · {course.duration[locale]}
        </span>
        <span className="mt-1 block font-serif text-[1.15rem] leading-[1.12] text-ink">
          {course.title[locale]}
        </span>
        <span className="mt-1 block line-clamp-2 text-sm leading-6 text-ink-muted">
          {course.shortDescription[locale]}
        </span>
        <span className="mt-2 flex items-end justify-between gap-3">
          <span className="min-w-0 text-sm text-ink-subtle">{nextDate}</span>
          <span className="flex shrink-0 items-center gap-2 font-sans text-sm font-semibold tabular-nums text-ink">
            {price}
            <span className="sr-only">{viewCourseLabel}</span>
            <ArrowRightIcon className="transition-transform duration-150 ease-standard group-hover/suggestion:translate-x-1" />
          </span>
        </span>
      </span>
    </Link>
  );
}

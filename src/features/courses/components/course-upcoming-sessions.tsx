import {formatCourseDateRange} from "@/features/courses/dates";
import type {CourseDate} from "@/features/courses/types";
import {partitionUpcomingSessions} from "@/features/courses/upcoming-sessions";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {CalendarIcon} from "@/shared/ui/icons";

export function CourseUpcomingSessions({
  dates,
  locale,
  courseSlug,
  heading,
  showMoreLabel,
  showLessLabel,
}: {
  dates: CourseDate[];
  locale: AppLocale;
  courseSlug: string;
  heading: string;
  showMoreLabel: string;
  showLessLabel: string;
}) {
  const {preview, extra} = partitionUpcomingSessions(dates);

  return (
    <div className="mt-5 border-t border-line-soft pt-5">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">
        <CalendarIcon className="h-3.5 w-3.5" />
        {heading}
      </p>
      <SessionList dates={preview} locale={locale} courseSlug={courseSlug} />
      {extra.length > 0 ? (
        <details className="group mt-1">
          <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-medium underline-offset-2 marker:hidden hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">{showMoreLabel}</span>
            <span className="hidden group-open:inline">{showLessLabel}</span>
          </summary>
          <SessionList dates={extra} locale={locale} courseSlug={courseSlug} />
        </details>
      ) : null}
    </div>
  );
}

function SessionList({
  dates,
  locale,
  courseSlug,
}: {
  dates: CourseDate[];
  locale: AppLocale;
  courseSlug: string;
}) {
  return (
    <ul className="mt-1.5">
      {dates.map((date) => (
        <li key={date.id}>
          <Link
            href={{
              pathname: "/courses/[slug]/book",
              params: {slug: courseSlug},
              query: {date: date.id},
            }}
            className="flex min-h-11 items-center text-sm font-medium text-ink underline-offset-2 hover:underline"
          >
            {formatCourseDateRange(date, locale)}
          </Link>
        </li>
      ))}
    </ul>
  );
}

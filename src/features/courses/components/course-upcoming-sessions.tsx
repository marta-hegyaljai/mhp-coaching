import {formatCourseDateRange} from "@/features/courses/dates";
import {
  publicDateBookingQuery,
  sessionOffer,
  type OccupancyByDate,
} from "@/features/courses/occupancy";
import type {CourseAvailability, CourseDate} from "@/features/courses/types";
import {partitionUpcomingSessions} from "@/features/courses/upcoming-sessions";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {CalendarIcon} from "@/shared/ui/icons";

export function CourseUpcomingSessions({
  dates,
  locale,
  courseSlug,
  occupancy = {},
  courseAvailability = "auto",
  heading,
  showMoreLabel,
  showLessLabel,
}: {
  dates: CourseDate[];
  locale: AppLocale;
  courseSlug: string;
  occupancy?: OccupancyByDate;
  courseAvailability?: CourseAvailability;
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
      <SessionList
        dates={preview}
        locale={locale}
        courseSlug={courseSlug}
        occupancy={occupancy}
        courseAvailability={courseAvailability}
      />
      {extra.length > 0 ? (
        <details className="group mt-1">
          <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-medium underline-offset-2 marker:hidden hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">{showMoreLabel}</span>
            <span className="hidden group-open:inline">{showLessLabel}</span>
          </summary>
          <SessionList
            dates={extra}
            locale={locale}
            courseSlug={courseSlug}
            occupancy={occupancy}
            courseAvailability={courseAvailability}
          />
        </details>
      ) : null}
    </div>
  );
}

function SessionList({
  dates,
  locale,
  courseSlug,
  occupancy,
  courseAvailability,
}: {
  dates: CourseDate[];
  locale: AppLocale;
  courseSlug: string;
  occupancy: OccupancyByDate;
  courseAvailability: CourseAvailability;
}) {
  return (
    <ul className="mt-1.5">
      {dates.map((date) => {
        const query = publicDateBookingQuery(
          sessionOffer(date, occupancy, courseAvailability),
          date.id,
        );
        const label = formatCourseDateRange(date, locale);

        return (
          <li key={date.id}>
            {query ? (
              <Link
                href={{
                  pathname: "/courses/[slug]/book",
                  params: {slug: courseSlug},
                  query,
                }}
                className="flex min-h-11 items-center text-sm font-medium text-ink underline-offset-2 hover:underline"
              >
                {label}
              </Link>
            ) : (
              <span className="flex min-h-11 items-center text-sm text-ink-muted">
                {label}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

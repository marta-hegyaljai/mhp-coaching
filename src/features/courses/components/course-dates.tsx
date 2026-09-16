import {formatCourseDateRange} from "@/features/courses/dates";
import {
  publicDateBookingQuery,
  publicSeatHint,
  seatsLeftForDate,
  sessionOffer,
  type OccupancyByDate,
} from "@/features/courses/occupancy";
import {courseAvailabilityOf, type Course, type CourseDate} from "@/features/courses/types";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon, CalendarIcon} from "@/shared/ui/icons";

/**
 * Each date is its own call to action: choosing a row carries the selection
 * into the booking form instead of asking for it twice.
 */
export function CourseDates({
  course,
  dates,
  locale,
  occupancy = {},
  bookLabel,
  waitlistLabel,
  closedLabel,
  seatsLabel,
  seatsLeftLabel,
}: {
  course: Course;
  dates: CourseDate[];
  locale: AppLocale;
  occupancy?: OccupancyByDate;
  bookLabel: string;
  waitlistLabel: string;
  closedLabel: string;
  seatsLabel: (capacity: number) => string;
  seatsLeftLabel: (count: number) => string;
}) {
  const courseAvailability = courseAvailabilityOf(course);

  return (
    <ul className="mt-6 grid gap-3 md:grid-cols-2">
      {dates.map((date) => {
        const offer = sessionOffer(date, occupancy, courseAvailability);
        const remaining = seatsLeftForDate(date, occupancy);
        const hint =
          offer === "open" ? publicSeatHint(remaining) : offer === "full" ? "full" : "plenty";
        const query = publicDateBookingQuery(offer, date.id);
        const label =
          offer === "closed" ? closedLabel : offer === "open" ? bookLabel : waitlistLabel;

        return (
          <li
            key={date.id}
            className="flex flex-col justify-between gap-5 border border-ink bg-parchment p-5"
          >
            <div className="min-w-0">
              <p className="font-serif text-subheading">{date.location[locale]}</p>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
                <CalendarIcon className="h-3.5 w-3.5" />
                {formatCourseDateRange(date, locale)}
                <span aria-hidden="true" className="text-ink-subtle">
                  ·
                </span>
                <span className="text-ink-subtle">
                  {hint === 1 || hint === 2
                    ? seatsLeftLabel(hint)
                    : seatsLabel(date.capacity)}
                </span>
              </p>
            </div>
            {query ? (
              <Link
                href={{
                  pathname: "/courses/[slug]/book",
                  params: {slug: course.slug[locale]},
                  query,
                }}
                className={`${buttonStyles({variant: "secondary"})} w-full shrink-0 sm:w-auto`}
              >
                {label}
                <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
              </Link>
            ) : (
              <p className="text-sm font-medium text-ink-muted">{closedLabel}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

import {formatCourseDateRange} from "@/features/courses/dates";
import type {Course, CourseDate} from "@/features/courses/types";
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
  bookLabel,
  seatsLabel,
}: {
  course: Course;
  dates: CourseDate[];
  locale: AppLocale;
  bookLabel: string;
  seatsLabel: (capacity: number) => string;
}) {
  return (
    <ul className="mt-6">
      {dates.map((date) => (
        <li
          key={date.id}
          className="flex flex-col gap-4 border-t border-line py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
        >
          <div className="min-w-0">
            <p className="font-serif text-subheading">{date.location[locale]}</p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
              <CalendarIcon className="h-3.5 w-3.5 text-bronze" />
              {formatCourseDateRange(date, locale)}
              <span aria-hidden="true" className="text-ink-subtle">
                ·
              </span>
              <span className="text-ink-subtle">{seatsLabel(date.capacity)}</span>
            </p>
          </div>
          <Link
            href={{
              pathname: "/courses/[slug]/book",
              params: {slug: course.slug[locale]},
              query: {date: date.id},
            }}
            className={`${buttonStyles({variant: "secondary"})} w-full shrink-0 sm:w-auto`}
          >
            {bookLabel}
            <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

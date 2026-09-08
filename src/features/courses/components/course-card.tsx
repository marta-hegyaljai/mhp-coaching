import {formatCourseDateRange} from "@/features/courses/dates";
import {getBookableDates} from "@/features/courses/queries";
import type {Course} from "@/features/courses/types";
import {formatChf} from "@/features/payments/money";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {ArrowRightIcon, CalendarIcon, PinIcon} from "@/shared/ui/icons";
import {Eyebrow} from "@/shared/ui/layout";

export function CourseCard({
  course,
  locale,
  detailsLabel,
  headingLevel = "h2",
}: {
  course: Course;
  locale: AppLocale;
  detailsLabel: string;
  headingLevel?: "h2" | "h3";
}) {
  const nextDate = getBookableDates(course)[0];
  const Heading = headingLevel;
  const href = {
    pathname: "/courses/[slug]",
    params: {slug: course.slug[locale]},
  } as const;

  return (
    <Link
      href={href}
      className="group/card block h-full rounded-panel focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink"
    >
      <article className="flex h-full flex-col border border-ink bg-parchment p-5 transition-[background-color,transform] duration-150 group-hover/card:-translate-y-0.5 group-hover/card:bg-hover sm:p-6">
        <div className="flex h-full flex-col gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <Eyebrow>{course.duration[locale]}</Eyebrow>
              <p className="text-sm font-semibold">
                {formatChf(course.priceChf, locale, {compact: true})}
              </p>
            </div>
            <Heading className="mt-3 font-serif text-heading">
              {course.title[locale]}
            </Heading>
            <p className="mt-3 text-base leading-7 text-ink-muted">
              {course.shortDescription[locale]}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line-soft pt-4 text-sm text-ink-subtle">
              {nextDate ? (
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {formatCourseDateRange(nextDate, locale)}
                </span>
              ) : null}
              <span className="flex items-center gap-1.5">
                <PinIcon className="h-3.5 w-3.5" />
                {course.location[locale]}
              </span>
            </div>
          </div>
          <span className="inline-flex min-h-11 w-full items-center justify-between border-t border-current pt-3 text-sm font-bold uppercase tracking-[0.08em] sm:w-auto">
            {detailsLabel}
            <ArrowRightIcon className="transition-transform duration-150 ease-standard group-hover/card:translate-x-1" />
          </span>
        </div>
      </article>
    </Link>
  );
}

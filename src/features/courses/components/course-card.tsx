import {formatCourseDateRange} from "@/features/courses/dates";
import {getBookableDates} from "@/features/courses/queries";
import type {Course} from "@/features/courses/types";
import {formatChf} from "@/features/payments/money";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon, CalendarIcon, PinIcon} from "@/shared/ui/icons";
import {Eyebrow} from "@/shared/ui/layout";

export function CourseCard({
  course,
  locale,
  detailsLabel,
  seatsLabel,
  headingLevel = "h2",
}: {
  course: Course;
  locale: AppLocale;
  detailsLabel: string;
  seatsLabel?: string;
  headingLevel?: "h2" | "h3";
}) {
  const nextDate = getBookableDates(course)[0];
  const Heading = headingLevel;
  const href = {
    pathname: "/courses/[slug]",
    params: {slug: course.slug[locale]},
  } as const;

  return (
    <article className="group/card border-t border-line py-8 transition-colors duration-200 first:border-t-0 sm:py-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Eyebrow>{course.duration[locale]}</Eyebrow>
            <p className="text-sm font-semibold text-ink">
              {formatChf(course.priceChf, locale, {compact: true})}
            </p>
          </div>
          <Heading className="mt-3 font-serif text-heading">
            <Link
              href={href}
              className="transition-colors duration-200 group-hover/card:text-bronze"
            >
              {course.title[locale]}
            </Link>
          </Heading>
          <p className="mt-3 text-base leading-7 text-ink-muted">
            {course.shortDescription[locale]}
          </p>
          {nextDate || seatsLabel ? (
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-subtle">
              {nextDate ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5 text-bronze" />
                    {formatCourseDateRange(nextDate, locale)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <PinIcon className="h-3.5 w-3.5 text-bronze" />
                    {nextDate.location[locale]}
                  </span>
                </>
              ) : null}
              {seatsLabel ? <span>{seatsLabel}</span> : null}
            </div>
          ) : null}
        </div>
        <Link
          href={href}
          className={`${buttonStyles({variant: "secondary"})} w-full shrink-0 sm:w-auto`}
        >
          {detailsLabel}
          <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5 group-hover/card:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}

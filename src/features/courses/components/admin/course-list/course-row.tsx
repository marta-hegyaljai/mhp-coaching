import type {CourseListEntry} from "@/features/courses/admin-list";
import {CourseOrderControls} from "@/features/courses/components/admin/course-order-controls";
import {formatCourseDateRange} from "@/features/courses/dates";
import {isProgrammeCourse} from "@/features/courses/types";
import {formatChf} from "@/features/payments/money";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Chip} from "@/shared/ui/chip";
import {ChevronRightIcon} from "@/shared/ui/icons";
import {Price} from "@/shared/ui/price";

export type CourseRowLabels = {
  manage: string;
  programme: string;
  unpublished: string;
  noUpcoming: string;
  sessionCount: (count: number) => string;
  enrolmentCount: (count: number) => string;
  category: string;
};

/**
 * One catalogue row. The title carries a stretched link so the whole row is
 * one target, while the reorder controls sit above it and stay separate.
 */
export function CourseRow({
  entry,
  locale,
  labels,
  reorder,
}: {
  entry: CourseListEntry;
  locale: AppLocale;
  labels: CourseRowLabels;
  /** Omitted while the list is filtered, where neighbours are not visible. */
  reorder?: {isFirst: boolean; isLast: boolean};
}) {
  const {course, position, published, nextDate} = entry;

  return (
    <li className="relative border-b border-line-soft last:border-b-0 transition-colors duration-150 ease-standard hover:bg-hover has-[a:focus-visible]:bg-hover">
      <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2 px-4 py-4 sm:px-5 lg:grid-cols-[2.5rem_minmax(0,1fr)_8rem_auto] lg:items-center lg:gap-x-5">
        <p className="pt-1 font-sans text-xs font-semibold tabular-nums text-ink-subtle lg:pt-0">
          {position}
        </p>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h2
              className={`font-serif text-lg leading-tight ${published ? "text-ink" : "text-ink-muted"}`}
            >
              <Link
                href={{pathname: "/admin/courses/[id]", params: {id: course.id}}}
                className="rounded-panel after:absolute after:inset-0 focus-visible:outline-none"
              >
                <span className="sr-only">{labels.manage}: </span>
                {course.title[locale]}
              </Link>
            </h2>
            {!published ? <Chip tone="strong">{labels.unpublished}</Chip> : null}
            {isProgrammeCourse(course) ? <Chip>{labels.programme}</Chip> : null}
          </div>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-subtle">
            <span className="font-semibold uppercase tracking-[0.12em]">
              {labels.category}
            </span>
            <Separator />
            <span>{labels.sessionCount(entry.sessionCount)}</span>
            <Separator />
            <span>{labels.enrolmentCount(entry.enrolments)}</span>
            {/* The date starts its own line on narrow screens, so its
                separator would otherwise dangle at the end of the line. */}
            <Separator className="hidden lg:inline" />
            <span className="basis-full lg:basis-auto">
              {nextDate ? (
                <span className="tabular-nums">{formatCourseDateRange(nextDate, locale)}</span>
              ) : (
                <Chip>{labels.noUpcoming}</Chip>
              )}
            </span>
          </p>
        </div>

        {/* Narrow screens keep price and controls on one line; `lg:contents`
            dissolves the wrapper so both become grid columns on wide screens. */}
        <div className="col-start-2 flex items-center justify-between gap-3 lg:contents">
          <Price size="sm" className="lg:text-right">
            {formatChf(course.priceChf, locale, {compact: true})}
          </Price>

          <div className="relative z-10 flex items-center gap-3 lg:justify-self-end">
            {reorder ? (
              <CourseOrderControls
                locale={locale}
                courseId={course.id}
                isFirst={reorder.isFirst}
                isLast={reorder.isLast}
              />
            ) : null}
            <ChevronRightIcon aria-hidden="true" className="hidden text-ink-subtle lg:block" />
          </div>
        </div>
      </div>
    </li>
  );
}

function Separator({className = ""}: {className?: string}) {
  return (
    <span aria-hidden="true" className={className}>
      ·
    </span>
  );
}

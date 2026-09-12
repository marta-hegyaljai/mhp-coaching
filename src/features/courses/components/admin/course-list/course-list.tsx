import type {CourseListEntry} from "@/features/courses/admin-list";
import type {AppLocale} from "@/i18n/routing";

import {CourseRow, type CourseRowLabels} from "./course-row";

export type CourseListLabels = Omit<CourseRowLabels, "category"> & {
  resultCount: string;
  orderHint: string;
  orderLocked: string;
  empty: string;
  categories: Record<CourseListEntry["course"]["category"], string>;
};

/**
 * The single catalogue list: it both manages and orders courses, so there is
 * never a second copy of the same rows on the page.
 */
export function CourseList({
  entries,
  total,
  locale,
  canReorder,
  labels,
}: {
  entries: CourseListEntry[];
  /** Catalogue size, used to size the reorder bounds of the last row. */
  total: number;
  locale: AppLocale;
  canReorder: boolean;
  labels: CourseListLabels;
}) {
  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="font-sans text-sm tabular-nums text-ink">{labels.resultCount}</p>
        <p className="max-w-md text-xs leading-6 text-ink-subtle lg:text-right">
          {canReorder ? labels.orderHint : labels.orderLocked}
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="mt-4 rounded-panel border border-ink bg-white px-5 py-10 text-center">
          <p className="text-sm text-ink-muted">{labels.empty}</p>
        </div>
      ) : (
        <ul className="mt-4 overflow-hidden rounded-panel border border-ink bg-white">
          {entries.map((entry) => (
            <CourseRow
              key={entry.course.id}
              entry={entry}
              locale={locale}
              labels={{...labels, category: labels.categories[entry.course.category]}}
              reorder={
                canReorder
                  ? {isFirst: entry.position === 1, isLast: entry.position === total}
                  : undefined
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}

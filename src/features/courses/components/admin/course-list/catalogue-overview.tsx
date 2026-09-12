import {courseListHref} from "@/features/courses/admin-query";
import type {CourseListSummary} from "@/features/courses/admin-list";
import {Link} from "@/i18n/navigation";
import {ChevronRightIcon} from "@/shared/ui/icons";

export type CatalogueOverviewLabels = {
  total: string;
  published: string;
  withoutUpcoming: string;
  enrolments: string;
};

type Metric = {
  key: string;
  label: string;
  value: number;
  /** Set when the metric narrows the list to exactly what it counts. */
  filter?: ReturnType<typeof courseListHref>;
};

/**
 * Answers "what needs attention?" before the admin reads a single row. The
 * two actionable counts double as filters into the list below.
 */
export function CatalogueOverview({
  summary,
  labels,
}: {
  summary: CourseListSummary;
  labels: CatalogueOverviewLabels;
}) {
  const metrics: Metric[] = [
    {key: "total", label: labels.total, value: summary.total},
    {
      key: "published",
      label: labels.published,
      value: summary.published,
      filter: summary.published > 0 ? courseListHref({published: "yes"}) : undefined,
    },
    {
      key: "withoutUpcoming",
      label: labels.withoutUpcoming,
      value: summary.withoutUpcoming,
      filter:
        summary.withoutUpcoming > 0 ? courseListHref({upcoming: "no"}) : undefined,
    },
    {key: "enrolments", label: labels.enrolments, value: summary.enrolments},
  ];

  return (
    // The 1px gap over an ink background draws the hairlines between cells.
    <dl className="mt-8 grid gap-px overflow-hidden rounded-panel border border-ink bg-ink sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        // `dt`/`dd` must stay direct children of this wrapper, so the filter
        // link covers the cell from inside the term instead of wrapping it.
        <div
          key={metric.key}
          className={`relative bg-white px-4 py-4 ${
            metric.filter
              ? "transition-colors duration-150 ease-standard hover:bg-hover has-[a:focus-visible]:bg-hover"
              : ""
          }`}
        >
          <dt className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-ink-subtle">
            {metric.filter ? (
              <Link
                href={metric.filter}
                className="after:absolute after:inset-0 focus-visible:outline-none"
              >
                {metric.label}
              </Link>
            ) : (
              metric.label
            )}
          </dt>
          <dd className="mt-1 flex items-center gap-2 font-sans text-2xl font-semibold tabular-nums text-ink">
            {metric.value}
            {metric.filter ? (
              <ChevronRightIcon aria-hidden="true" className="text-ink-subtle" />
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

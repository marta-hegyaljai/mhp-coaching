import {courseListHref} from "@/features/courses/admin-query";
import type {CourseListSummary} from "@/features/courses/admin-list";
import {MetricStrip, type Metric} from "@/shared/ui/metric-strip";

export type CatalogueOverviewLabels = {
  total: string;
  published: string;
  withoutUpcoming: string;
  enrolments: string;
};

/**
 * Answers "what needs attention?" before the admin reads a single row.
 * Published and undated counts filter this list; enrolments open the
 * catalogue-wide inscription index.
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
      href: summary.published > 0 ? courseListHref({published: "yes"}) : undefined,
      tone: "ok",
    },
    {
      key: "withoutUpcoming",
      label: labels.withoutUpcoming,
      value: summary.withoutUpcoming,
      href: summary.withoutUpcoming > 0 ? courseListHref({upcoming: "no"}) : undefined,
      tone: "gold",
    },
    {
      key: "enrolments",
      label: labels.enrolments,
      value: summary.enrolments,
      href:
        summary.enrolments > 0 ? "/admin/courses/enrolments" : undefined,
    },
  ];

  return <MetricStrip metrics={metrics} className="mt-8" />;
}

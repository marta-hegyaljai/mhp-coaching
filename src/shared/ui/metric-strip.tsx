import type {ComponentProps} from "react";

import {Link} from "@/i18n/navigation";
import {ChevronRightIcon} from "@/shared/ui/icons";

export type Metric = {
  key: string;
  label: string;
  value: number | string;
  /** Set when the metric narrows the list below to exactly what it counts. */
  href?: ComponentProps<typeof Link>["href"];
  /** Colour the figure when it needs scanning: ok, stop or gold. */
  tone?: "ok" | "stop" | "gold";
};

export type MetricStripDensity = "card" | "compact" | "trio";

// `card` leads a full operational index; `compact` leads a list nested inside
// a record; `trio` is three attention counts in one row, including on a phone.
const densities: Record<MetricStripDensity, {grid: string; cell: string; value: string}> = {
  card: {
    grid: "sm:grid-cols-2 lg:grid-cols-4",
    cell: "px-4 py-4",
    value: "text-2xl",
  },
  compact: {
    grid: "grid-cols-2 lg:grid-cols-4",
    cell: "px-3 py-2.5 sm:px-4",
    value: "text-xl",
  },
  trio: {
    grid: "grid-cols-3",
    cell: "px-2.5 py-2 sm:px-4",
    value: "text-lg sm:text-xl",
  },
};

/**
 * The hairline metric strip that answers "what needs attention?" before the
 * first row is read. Actionable metrics double as filters into the list.
 */
export function MetricStrip({
  metrics,
  density = "card",
  className = "",
}: {
  metrics: Metric[];
  density?: MetricStripDensity;
  className?: string;
}) {
  const style = densities[density];

  return (
    // The 1px gap over an ink background draws the hairlines between cells.
    <dl
      className={`grid gap-px overflow-hidden rounded-panel border border-ink bg-ink ${style.grid} ${className}`}
    >
      {metrics.map((metric) => (
        // `dt`/`dd` must stay direct children of this wrapper, so the filter
        // link covers the cell from inside the term instead of wrapping it.
        <div
          key={metric.key}
          className={`relative bg-white ${style.cell} ${
            metric.href
              ? "transition-colors duration-150 ease-standard hover:bg-hover has-[a:focus-visible]:bg-hover"
              : ""
          }`}
        >
          <dt
            className={`text-[0.7rem] font-bold uppercase tracking-[0.18em] ${
              metric.tone === "gold" && hasAttentionValue(metric.value)
                ? "text-gold-deep"
                : "text-ink-subtle"
            }`}
          >
            {metric.href ? (
              <Link
                href={metric.href}
                className="after:absolute after:inset-0 focus-visible:outline-none"
              >
                {metric.label}
              </Link>
            ) : (
              metric.label
            )}
          </dt>
          <dd
            className={`mt-1 flex items-center gap-2 font-sans font-semibold tabular-nums ${style.value} ${metricToneClass(metric)}`}
          >
            {metric.value}
            {metric.href ? <ChevronRightIcon className="text-ink-subtle" /> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function metricToneClass(metric: Metric): string {
  if (!metric.tone || !hasAttentionValue(metric.value)) {
    return "text-ink";
  }

  if (metric.tone === "ok") {
    return "text-status-ok";
  }
  if (metric.tone === "stop") {
    return "text-status-stop";
  }
  return "text-gold-deep";
}

function hasAttentionValue(value: number | string): boolean {
  return typeof value === "number" ? value > 0 : value !== "0";
}

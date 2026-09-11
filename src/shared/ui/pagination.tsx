import type {PathnameHref} from "@/i18n/href";
import {Link} from "@/i18n/navigation";

const stepClass = "inline-flex min-h-11 items-center underline-offset-4 hover:underline";

/**
 * Paged list navigation. Unavailable directions stay in place as inert text so
 * the row never reflows between pages.
 */
export function Pagination({
  previous,
  next,
  status,
  labels,
  className = "",
}: {
  previous: PathnameHref | null;
  next: PathnameHref | null;
  status: string;
  labels: {previous: string; next: string};
  className?: string;
}) {
  return (
    <nav
      aria-label={status}
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm ${className}`}
    >
      {previous ? (
        <Link href={previous} className={stepClass} rel="prev">
          {labels.previous}
        </Link>
      ) : (
        <span className="inline-flex min-h-11 items-center text-ink-subtle">
          {labels.previous}
        </span>
      )}
      <p className="font-sans tabular-nums text-ink-muted">{status}</p>
      {next ? (
        <Link href={next} className={stepClass} rel="next">
          {labels.next}
        </Link>
      ) : (
        <span className="inline-flex min-h-11 items-center text-ink-subtle">{labels.next}</span>
      )}
    </nav>
  );
}

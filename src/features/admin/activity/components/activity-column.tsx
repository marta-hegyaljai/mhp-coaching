import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {Pagination} from "@/shared/ui/pagination";

import type {ActivityFeed} from "../feed";
import {listedActivityTotal} from "../listed";
import {
  activityFilterHref,
  activityHistoryPageHref,
  type ActivityQuery,
} from "../query";
import type {ActivityKind, ActivityWindow} from "../types";
import {ActivityList, type ActivityListLabels} from "./activity-list";

export type ActivityColumnLabels = ActivityListLabels & {
  emptySearch: string;
  log: string;
  pageStatus: (page: number, pageCount: number) => string;
  previous: string;
  next: string;
};

/**
 * One window of the board: a labelled pane that scrolls internally so the
 * page itself can stay still.
 */
export function ActivityColumn({
  when,
  feed,
  query,
  locale,
  title,
  empty,
  labels,
  paginate = false,
}: {
  when: ActivityWindow;
  feed: ActivityFeed;
  query: ActivityQuery;
  locale: AppLocale;
  title: string;
  empty: string;
  labels: ActivityColumnLabels;
  paginate?: boolean;
}) {
  const {entries, total, page, pageCount} = feed.page;
  const listed = listedActivityTotal(feed.counts, query.kind);
  const emptyMessage = query.q !== "" ? labels.emptySearch : empty;
  const showSpotlights =
    feed.counts.waitlist > 0 || feed.counts.message > 0 || feed.counts.change > 0;

  return (
    <section
      aria-label={title}
      className="flex min-h-0 min-w-0 flex-col bg-white"
    >
      <header className="shrink-0 border-b border-line px-3 py-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-sans text-[0.7rem] font-bold uppercase tracking-[0.16em] text-ink">
            {title}
          </h2>
          <p className="font-sans text-sm font-semibold tabular-nums text-ink">{listed}</p>
        </div>
        {showSpotlights ? (
          <p className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink-subtle">
            <Spotlight
              kind="waitlist"
              count={feed.counts.waitlist}
              label={labels.kinds.waitlist}
              query={query}
            />
            <Spotlight
              kind="message"
              count={feed.counts.message}
              label={labels.kinds.message}
              query={query}
            />
            {feed.counts.change > 0 ? (
              <Spotlight
                kind="change"
                count={feed.counts.change}
                label={labels.log}
                query={query}
              />
            ) : null}
          </p>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {entries.length === 0 ? (
          <p className="px-3 py-4 text-sm leading-6 text-ink-muted">{emptyMessage}</p>
        ) : (
          <ActivityList
            entries={entries}
            when={when}
            today={feed.bounds.today}
            todayLabel={title}
            locale={locale}
            framed={false}
            compact
            stickyHeadings
            labels={{
              list: title,
              open: labels.open,
              kinds: labels.kinds,
              actionLabels: labels.actionLabels,
            }}
          />
        )}
      </div>

      {paginate && pageCount > 1 ? (
        <Pagination
          compact
          className="shrink-0"
          previous={page > 1 ? activityHistoryPageHref(query, page - 1) : null}
          next={page < pageCount ? activityHistoryPageHref(query, page + 1) : null}
          status={labels.pageStatus(page, pageCount)}
          labels={{previous: labels.previous, next: labels.next}}
        />
      ) : total > entries.length ? (
        <p className="shrink-0 border-t border-line px-3 py-2 font-sans text-xs tabular-nums text-ink-muted">
          {entries.length} / {total}
        </p>
      ) : null}
    </section>
  );
}

function Spotlight({
  kind,
  count,
  label,
  query,
}: {
  kind: ActivityKind;
  count: number;
  label: string;
  query: ActivityQuery;
}) {
  if (count === 0) {
    return null;
  }

  const current = query.kind === kind;

  return (
    <Link
      href={activityFilterHref(query, {kind: current ? "all" : kind})}
      aria-current={current ? "page" : undefined}
      className={`underline-offset-4 hover:underline ${
        current ? "text-ink" : "text-ink-subtle"
      }`}
    >
      {count} {label}
    </Link>
  );
}

import {addLocalDays} from "@/features/rooms/timezone";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {Pagination} from "@/shared/ui/pagination";
import {ChevronLeftIcon, ChevronRightIcon} from "@/shared/ui/icons";

import type {ActivityFeed} from "../feed";
import {listedActivityTotal} from "../listed";
import {
  activityFilterHref,
  activityFocusDay,
  activityHistoryPageHref,
  activityHref,
  showsCancelledActivity,
  type ActivityQuery,
} from "../query";
import type {ActivityKind, ActivityWindow} from "../types";
import {ActivityCancelledFilter} from "./activity-cancelled-filter";
import {ActivityDayJump} from "./activity-day-nav";
import {ActivityList, type ActivityListLabels} from "./activity-list";

export type ActivityColumnLabels = ActivityListLabels & {
  emptySearch: string;
  emptyDay: string;
  log: string;
  pageStatus: (page: number, pageCount: number) => string;
  previous: string;
  next: string;
  previousDay: string;
  nextDay: string;
  jumpToDate: string;
  jumpToday: string;
  showCancelled: string;
};

const dayStepClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center text-ink transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

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
  todayLabel,
  empty,
  labels,
  paginate = false,
}: {
  when: ActivityWindow;
  feed: ActivityFeed;
  query: ActivityQuery;
  locale: AppLocale;
  title: string;
  /** Name for rows that fall on the Zurich day; never the pane title. */
  todayLabel: string;
  empty: string;
  labels: ActivityColumnLabels;
  paginate?: boolean;
}) {
  const {entries, total, page, pageCount} = feed.page;
  const listed = listedActivityTotal(feed.counts, query.kind);
  const viewingToday = when === "today" && query.day === null;
  const emptyMessage =
    query.q !== ""
      ? labels.emptySearch
      : when === "today" && !viewingToday
        ? labels.emptyDay
        : empty;
  const showSpotlights =
    when !== "today" &&
    (feed.counts.waitlist > 0 || feed.counts.message > 0 || feed.counts.change > 0);
  const focusDay = activityFocusDay(query);
  const nextDay = addLocalDays(focusDay, 1);

  return (
    <section
      aria-label={title}
      className="flex min-h-0 min-w-0 flex-col bg-white"
    >
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-3">
        <h2 className="shrink-0 font-sans text-[0.7rem] font-bold uppercase tracking-[0.16em] text-gold-deep">
          {title}
        </h2>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {when === "today" ? (
            <div className="flex min-w-0 items-center">
              <Link
                href={activityHref({...query, day: addLocalDays(focusDay, -1)})}
                aria-label={labels.previousDay}
                className={dayStepClass}
              >
                <ChevronLeftIcon />
              </Link>
              <ActivityDayJump
                locale={locale}
                query={query}
                day={focusDay}
                label={labels.jumpToDate}
              />
              <Link
                href={activityHref({...query, day: nextDay})}
                aria-label={labels.nextDay}
                className={dayStepClass}
              >
                <ChevronRightIcon />
              </Link>
              {viewingToday ? null : (
                <Link
                  href={activityHref({...query, day: null})}
                  className="ml-1 shrink-0 font-sans text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
                >
                  {labels.jumpToday}
                </Link>
              )}
            </div>
          ) : (
            <ActivityCancelledFilter
              locale={locale}
              query={query}
              when={when}
              checked={showsCancelledActivity(query, when)}
              label={labels.showCancelled}
            />
          )}
          {showSpotlights ? (
            <p className="flex min-w-0 flex-1 items-center gap-x-2 overflow-x-auto whitespace-nowrap text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink-subtle [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
        </div>
        <p className="shrink-0 font-sans text-sm font-semibold tabular-nums text-ink">
          {listed}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {entries.length === 0 ? (
          <p className="px-3 py-4 text-sm leading-6 text-ink-muted">{emptyMessage}</p>
        ) : (
          <ActivityList
            entries={entries}
            when={when}
            today={feed.bounds.today}
            todayLabel={todayLabel}
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
      className={`shrink-0 underline-offset-4 hover:underline ${
        current
          ? "text-ink"
          : kind === "waitlist" || kind === "message"
            ? "text-gold-deep"
            : "text-ink-subtle"
      }`}
    >
      {count} {label}
    </Link>
  );
}

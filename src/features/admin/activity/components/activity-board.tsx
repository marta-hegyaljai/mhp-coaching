import type {AppLocale} from "@/i18n/routing";
import {SegmentedLinks} from "@/shared/ui/segmented-links";

import type {ActivityBriefing} from "../feed";
import {activityHref, type ActivityQuery} from "../query";
import type {ActivityWindow} from "../types";
import {ActivityColumn, type ActivityColumnLabels} from "./activity-column";

export type ActivityBoardLabels = {
  today: string;
  upcoming: string;
  history: string;
  emptyToday: string;
  emptyUpcoming: string;
  emptyHistory: string;
  windows: string;
} & ActivityColumnLabels;

/**
 * Three windows, one viewport. Desktop is three equal columns. A phone shows
 * one full-height pane at a time and a Period switcher, defaulting to Today.
 * Each pane scrolls; the page does not have to.
 */
export function ActivityBoard({
  briefing,
  query,
  locale,
  labels,
}: {
  briefing: ActivityBriefing;
  query: ActivityQuery;
  locale: AppLocale;
  labels: ActivityBoardLabels;
}) {
  const panes: Array<{
    when: ActivityWindow;
    feed: ActivityBriefing[ActivityWindow];
    title: string;
    empty: string;
    paginate: boolean;
  }> = [
    {
      when: "today",
      feed: briefing.today,
      title: labels.today,
      empty: labels.emptyToday,
      paginate: false,
    },
    {
      when: "upcoming",
      feed: briefing.upcoming,
      title: labels.upcoming,
      empty: labels.emptyUpcoming,
      paginate: false,
    },
    {
      when: "history",
      feed: briefing.history,
      title: labels.history,
      empty: labels.emptyHistory,
      paginate: true,
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="shrink-0 lg:hidden">
        <SegmentedLinks
          fill
          label={labels.windows}
          items={panes.map((pane) => ({
            key: pane.when,
            href: activityHref({...query, window: pane.when}),
            label: pane.title,
            current: query.window === pane.when,
          }))}
        />
      </div>
      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] gap-px overflow-hidden rounded-panel border border-ink bg-ink lg:grid-cols-3">
        {panes.map((pane) => (
          <ActivityColumn
            key={pane.when}
            when={pane.when}
            active={query.window === pane.when}
            feed={pane.feed}
            query={query}
            locale={locale}
            title={pane.title}
            todayLabel={labels.today}
            empty={pane.empty}
            paginate={pane.paginate}
            labels={labels}
          />
        ))}
      </div>
    </div>
  );
}

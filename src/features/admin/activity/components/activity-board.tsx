import type {AppLocale} from "@/i18n/routing";

import type {ActivityBriefing} from "../feed";
import type {ActivityQuery} from "../query";
import type {ActivityWindow} from "../types";
import {ActivityColumn, type ActivityColumnLabels} from "./activity-column";

export type ActivityBoardLabels = {
  today: string;
  upcoming: string;
  history: string;
  emptyToday: string;
  emptyUpcoming: string;
  emptyHistory: string;
} & ActivityColumnLabels;

/**
 * Three windows, one viewport. Desktop is three equal columns; a phone stacks
 * the same panes with Today given the larger share. Each pane scrolls; the
 * page does not have to.
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
    <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-px overflow-hidden rounded-panel border border-ink bg-ink lg:grid-cols-3 lg:grid-rows-[minmax(0,1fr)]">
      {panes.map((pane) => (
        <ActivityColumn
          key={pane.when}
          when={pane.when}
          feed={pane.feed}
          query={query}
          locale={locale}
          title={pane.title}
          empty={pane.empty}
          paginate={pane.paginate}
          labels={labels}
        />
      ))}
    </div>
  );
}

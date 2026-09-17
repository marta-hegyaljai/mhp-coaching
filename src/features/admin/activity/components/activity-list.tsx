import type {AppLocale} from "@/i18n/routing";

import {groupActivityEntries} from "../group";
import type {ActivityEntry, ActivityWindow} from "../types";
import {ActivityRow, type ActivityRowLabels} from "./activity-row";

export type ActivityListLabels = ActivityRowLabels & {
  list: string;
};

/**
 * Day headings when the window spans more than today, then calendar-dense
 * rows. The board supplies the frame; a standalone list can keep its own.
 */
export function ActivityList({
  entries,
  when,
  today,
  todayLabel,
  locale,
  labels,
  framed = true,
  compact = false,
  stickyHeadings = false,
}: {
  entries: ActivityEntry[];
  when: ActivityWindow;
  today: string;
  todayLabel: string;
  locale: AppLocale;
  labels: ActivityListLabels;
  framed?: boolean;
  compact?: boolean;
  stickyHeadings?: boolean;
}) {
  const groups = groupActivityEntries(entries, when, locale, today, todayLabel);

  return (
    <ul
      aria-label={labels.list}
      className={framed ? "overflow-hidden rounded-panel border border-ink" : ""}
    >
      {groups.map((group, index) => (
        <li key={group.key} className={index > 0 ? "border-t border-ink" : ""}>
          {group.label ? (
            <h3
              className={`border-b border-line px-3 py-1.5 font-sans text-[0.65rem] font-bold uppercase leading-4 tracking-[0.12em] text-ink-subtle ${
                stickyHeadings ? "sticky top-0 z-10 bg-white" : "bg-white"
              }`}
            >
              {group.label}
            </h3>
          ) : null}
          <ul>
            {group.entries.map((entry) => (
              <ActivityRow
                key={entry.id}
                entry={entry}
                labels={labels}
                compact={compact}
              />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

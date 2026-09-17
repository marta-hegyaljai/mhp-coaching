import type {AppLocale} from "@/i18n/routing";

import {groupActivityEntries} from "../group";
import type {ActivityEntry, ActivityWindow} from "../types";
import {ActivityRow, type ActivityRowLabels} from "./activity-row";

export type ActivityListLabels = ActivityRowLabels & {
  list: string;
};

/**
 * One timeline at every breakpoint: day headings when the window spans more
 * than today, then calendar-dense rows. The same records used to split into a
 * wide table and a stack of cards; both hid the next row behind scrolling.
 */
export function ActivityList({
  entries,
  when,
  today,
  todayLabel,
  locale,
  labels,
}: {
  entries: ActivityEntry[];
  when: ActivityWindow;
  today: string;
  todayLabel: string;
  locale: AppLocale;
  labels: ActivityListLabels;
}) {
  const groups = groupActivityEntries(entries, when, locale, today, todayLabel);

  return (
    <ul
      aria-label={labels.list}
      className="overflow-hidden rounded-panel border border-ink"
    >
      {groups.map((group, index) => (
        <li key={group.key} className={index > 0 ? "border-t border-ink" : ""}>
          {group.label ? (
            <h2 className="border-b border-line bg-white px-3 py-1.5 font-sans text-[0.65rem] font-bold uppercase leading-4 tracking-[0.12em] text-ink-subtle sm:px-4">
              {group.label}
            </h2>
          ) : null}
          <ul>
            {group.entries.map((entry) => (
              <ActivityRow key={entry.id} entry={entry} labels={labels} />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

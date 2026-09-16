import type {ActivityEntry} from "../types";
import {ActivityCards} from "./activity-cards";
import {ActivityTable, type ActivityTableLabels} from "./activity-table";

/**
 * One list, two presentations: the dense table from `lg`, the bordered cards
 * below it. Both render the same entries, so nothing is hidden on a phone.
 */
export function ActivityList({
  entries,
  labels,
}: {
  entries: ActivityEntry[];
  labels: ActivityTableLabels;
}) {
  return (
    <>
      <div className="lg:hidden">
        <ActivityCards
          entries={entries}
          labels={{
            open: labels.open,
            kinds: labels.kinds,
            actionLabels: labels.actionLabels,
          }}
        />
      </div>
      <div className="hidden lg:block">
        <ActivityTable entries={entries} labels={labels} />
      </div>
    </>
  );
}

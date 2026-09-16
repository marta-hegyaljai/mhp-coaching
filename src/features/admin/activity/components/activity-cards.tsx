import {Link} from "@/i18n/navigation";
import {Chip} from "@/shared/ui/chip";
import {Panel} from "@/shared/ui/panel";
import {StatusLabel} from "@/shared/ui/status-label";

import type {ActivityEntry, ActivityKind} from "../types";
import {
  ActivityRowActions,
  hasRowActions,
  type ActivityActionLabels,
} from "./activity-row-actions";

export type ActivityCardLabels = {
  open: string;
  kinds: Record<ActivityKind, string>;
  actionLabels: ActivityActionLabels;
};

/** The phone view of the same records: one bordered card per entry. */
export function ActivityCards({
  entries,
  labels,
}: {
  entries: ActivityEntry[];
  labels: ActivityCardLabels;
}) {
  return (
    <ul className="grid gap-3">
      {entries.map((entry) => (
        <Panel as="li" key={entry.id} padding="sm">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <Chip>{labels.kinds[entry.kind]}</Chip>
            <p className="font-sans text-xs tabular-nums text-ink-muted">
              {entry.when.dateLabel}
              {entry.when.timeLabel ? (
                <>
                  <span className="mx-1.5">·</span>
                  {entry.when.timeLabel}
                </>
              ) : null}
            </p>
          </div>

          <p className="mt-3 font-medium text-ink">
            {entry.href ? (
              <Link
                href={entry.href}
                className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <span className="sr-only">{labels.open}: </span>
                {entry.title}
              </Link>
            ) : (
              entry.title
            )}
          </p>

          {entry.person ? (
            <p className="mt-1 text-sm leading-6 text-ink">
              {entry.person}
              {entry.personDetail ? (
                <span className="block break-all text-xs leading-5 text-ink-muted">
                  {entry.personDetail}
                </span>
              ) : null}
            </p>
          ) : null}

          {entry.detail ? (
            <p className="mt-2 text-xs leading-5 text-ink-muted">{entry.detail}</p>
          ) : null}

          {entry.status ? (
            <StatusLabel tone={entry.status.tone} className="mt-3">
              {entry.status.label}
            </StatusLabel>
          ) : null}

          {hasRowActions(entry) ? (
            <div className="mt-4 border-t border-line pt-4">
              <ActivityRowActions entry={entry} labels={labels.actionLabels} />
            </div>
          ) : null}
        </Panel>
      ))}
    </ul>
  );
}

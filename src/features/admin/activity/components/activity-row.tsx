import {Link} from "@/i18n/navigation";
import {StatusLabel} from "@/shared/ui/status-label";

import type {ActivityEntry, ActivityKind} from "../types";
import {
  ActivityRowActions,
  hasRowActions,
  type ActivityActionLabels,
} from "./activity-row-actions";

export type ActivityRowLabels = {
  open: string;
  kinds: Record<ActivityKind, string>;
  actionLabels: ActivityActionLabels;
};

function primaryOf(entry: ActivityEntry): string {
  return entry.person ?? entry.title;
}

function secondaryOf(entry: ActivityEntry): string | null {
  const parts = entry.person ? [entry.title, entry.detail] : [entry.detail];
  const secondary = parts.filter(Boolean).join(" · ");
  return secondary || null;
}

/**
 * One calendar-dense row: time leads, the person (or title) is the scan
 * target, and the channel sits as a qualifier rather than a bordered chip.
 */
export function ActivityRow({
  entry,
  labels,
  compact = false,
}: {
  entry: ActivityEntry;
  labels: ActivityRowLabels;
  compact?: boolean;
}) {
  const primary = primaryOf(entry);
  const secondary = secondaryOf(entry);
  const kind = labels.kinds[entry.kind];
  const actions = hasRowActions(entry);
  const timed = Boolean(entry.when.timeLabel);

  return (
    <li data-kind={entry.kind} className="border-b border-line-soft last:border-b-0">
      {entry.href ? (
        <Link
          href={entry.href}
          className={`grid min-h-11 grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-3 px-3 transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink ${
            compact ? "py-1.5" : "py-2"
          }`}
        >
          <TimeMark timeLabel={entry.when.timeLabel} timed={timed} />
          <RowCopy
            primary={primary}
            secondary={secondary}
            kind={kind}
            status={entry.status}
            openLabel={labels.open}
          />
        </Link>
      ) : (
        <div
          className={`grid min-h-11 grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-3 px-3 ${
            compact ? "py-1.5" : "py-2"
          }`}
        >
          <TimeMark timeLabel={entry.when.timeLabel} timed={timed} />
          <RowCopy
            primary={primary}
            secondary={secondary}
            kind={kind}
            status={entry.status}
          />
        </div>
      )}

      {actions ? (
        <div className="border-t border-line-soft px-3 py-2 sm:pl-[4.75rem]">
          <ActivityRowActions entry={entry} labels={labels.actionLabels} />
        </div>
      ) : null}
    </li>
  );
}

function RowCopy({
  primary,
  secondary,
  kind,
  status,
  openLabel,
}: {
  primary: string;
  secondary: string | null;
  kind: string;
  status: ActivityEntry["status"];
  openLabel?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-ink">
        {openLabel ? <span className="sr-only">{openLabel}: </span> : null}
        {primary}
      </p>
      {secondary ? (
        <p className="mt-0.5 truncate text-xs leading-5 text-ink-muted">{secondary}</p>
      ) : null}
      <div className="mt-0.5 flex min-w-0 items-baseline gap-x-2">
        <span className="shrink-0 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink-subtle">
          {kind}
        </span>
        {status ? (
          <StatusLabel tone={status.tone} className="min-w-0 truncate">
            {status.label}
          </StatusLabel>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Same-day ranges stack as start over end, the way a calendar list shows a
 * span without stealing width from the person column.
 */
function TimeMark({
  timeLabel,
  timed,
}: {
  timeLabel: string | null;
  timed: boolean;
}) {
  if (!timed || !timeLabel) {
    return <span className="font-sans text-sm tabular-nums text-ink-subtle">—</span>;
  }

  const [start, end] = timeLabel.split("–").map((part) => part.trim());
  const stacked = Boolean(start && end && !end.includes(" "));

  return (
    <span className="font-sans text-sm font-semibold tabular-nums leading-5 text-ink">
      {stacked ? (
        <>
          <span className="block">{start}</span>
          <span className="block font-normal text-ink-muted">{end}</span>
        </>
      ) : (
        timeLabel
      )}
    </span>
  );
}

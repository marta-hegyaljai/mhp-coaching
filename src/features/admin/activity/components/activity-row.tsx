import {Link} from "@/i18n/navigation";
import {ChevronRightIcon} from "@/shared/ui/icons";
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
}: {
  entry: ActivityEntry;
  labels: ActivityRowLabels;
}) {
  const primary = primaryOf(entry);
  const secondary = secondaryOf(entry);
  const kind = labels.kinds[entry.kind];
  const actions = hasRowActions(entry);
  const timed = Boolean(entry.when.timeLabel);
  const columns = entry.href
    ? "grid-cols-[3.5rem_minmax(0,1fr)] sm:grid-cols-[3.75rem_minmax(0,1fr)_minmax(7.5rem,9.5rem)_1rem]"
    : "grid-cols-[3.5rem_minmax(0,1fr)] sm:grid-cols-[3.75rem_minmax(0,1fr)_minmax(7.5rem,9.5rem)]";

  const body = (
    <>
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">
          {entry.href ? <span className="sr-only">{labels.open}: </span> : null}
          {primary}
        </p>
        {secondary ? (
          <p className="mt-0.5 truncate text-xs leading-5 text-ink-muted">{secondary}</p>
        ) : null}
        <div className="mt-0.5 flex min-w-0 items-baseline gap-x-2 sm:hidden">
          <span className="shrink-0 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink-subtle">
            {kind}
          </span>
          {entry.status ? (
            <StatusLabel tone={entry.status.tone} className="min-w-0 truncate">
              {entry.status.label}
            </StatusLabel>
          ) : null}
        </div>
      </div>
      <div className="hidden min-w-0 overflow-hidden sm:block">
        <p className="truncate text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink">
          {kind}
        </p>
        {entry.status ? (
          <StatusLabel tone={entry.status.tone} className="mt-0.5 truncate">
            {entry.status.label}
          </StatusLabel>
        ) : (
          <p className="mt-0.5 text-[0.7rem] uppercase tracking-[0.2em] text-ink-subtle">—</p>
        )}
      </div>
    </>
  );

  return (
    <li data-kind={entry.kind} className="border-b border-line-soft last:border-b-0">
      {entry.href ? (
        <Link
          href={entry.href}
          className={`grid min-h-11 items-start gap-x-3 px-3 py-2.5 transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink sm:px-4 ${columns}`}
        >
          <TimeMark timeLabel={entry.when.timeLabel} timed={timed} />
          {body}
          <span className="hidden self-center text-ink-subtle sm:block" aria-hidden="true">
            <ChevronRightIcon />
          </span>
        </Link>
      ) : (
        <div className={`grid min-h-11 items-start gap-x-3 px-3 py-2.5 sm:px-4 ${columns}`}>
          <TimeMark timeLabel={entry.when.timeLabel} timed={timed} />
          {body}
        </div>
      )}

      {actions ? (
        <div className="border-t border-line-soft px-3 py-2 sm:px-4 sm:pl-[4.75rem]">
          <ActivityRowActions entry={entry} labels={labels.actionLabels} />
        </div>
      ) : null}
    </li>
  );
}

function TimeMark({
  timeLabel,
  timed,
}: {
  timeLabel: string | null;
  timed: boolean;
}) {
  return (
    <span
      className={`font-sans text-sm tabular-nums ${
        timed ? "font-semibold text-ink" : "text-ink-subtle"
      }`}
    >
      {timed ? timeLabel : "—"}
    </span>
  );
}

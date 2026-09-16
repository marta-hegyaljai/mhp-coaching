import {Link} from "@/i18n/navigation";
import {Chip} from "@/shared/ui/chip";
import {StatusLabel} from "@/shared/ui/status-label";

import type {ActivityEntry, ActivityKind} from "../types";
import {ActivityRowActions, type ActivityActionLabels} from "./activity-row-actions";

export type ActivityTableLabels = {
  when: string;
  channel: string;
  who: string;
  what: string;
  status: string;
  actions: string;
  open: string;
  kinds: Record<ActivityKind, string>;
  actionLabels: ActivityActionLabels;
};

const cell = "px-4 py-3 align-top";

/** The dense desktop view: one scannable line per record across all channels. */
export function ActivityTable({
  entries,
  labels,
}: {
  entries: ActivityEntry[];
  labels: ActivityTableLabels;
}) {
  return (
    <div className="overflow-x-auto rounded-panel border border-ink">
      <table className="w-full min-w-[60rem] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-[0.14em] text-ink-subtle">
            <th className={`${cell} font-medium`}>{labels.when}</th>
            <th className={`${cell} font-medium`}>{labels.channel}</th>
            <th className={`${cell} font-medium`}>{labels.who}</th>
            <th className={`${cell} font-medium`}>{labels.what}</th>
            <th className={`${cell} font-medium`}>{labels.status}</th>
            <th className={`${cell} w-px font-medium text-right`}>
              <span className="sr-only">{labels.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.id}
              className="border-b border-line-soft transition-colors duration-150 ease-standard last:border-b-0 hover:bg-hover has-[a:focus-visible]:bg-hover"
            >
              <td className={`${cell} whitespace-nowrap`}>
                <span className="block font-sans font-semibold tabular-nums text-ink">
                  {entry.when.timeLabel ?? entry.when.dateLabel}
                </span>
                {entry.when.timeLabel ? (
                  <span className="mt-1 block text-xs leading-5 text-ink-muted">
                    {entry.when.dateLabel}
                  </span>
                ) : null}
              </td>
              <td className={cell}>
                <Chip>{labels.kinds[entry.kind]}</Chip>
              </td>
              <td className={cell}>
                <span className="block font-medium text-ink">{entry.person ?? "—"}</span>
                {entry.personDetail ? (
                  <span className="mt-1 block break-all text-xs leading-5 text-ink-muted">
                    {entry.personDetail}
                  </span>
                ) : null}
              </td>
              <td className={cell}>
                {entry.href ? (
                  <Link
                    href={entry.href}
                    className="font-medium text-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    <span className="sr-only">{labels.open}: </span>
                    {entry.title}
                  </Link>
                ) : (
                  <span className="font-medium text-ink">{entry.title}</span>
                )}
                {entry.detail ? (
                  <span className="mt-1 block text-xs leading-5 text-ink-muted">
                    {entry.detail}
                  </span>
                ) : null}
              </td>
              <td className={cell}>
                {entry.status ? (
                  <StatusLabel tone={entry.status.tone}>{entry.status.label}</StatusLabel>
                ) : (
                  <span className="text-ink-subtle">—</span>
                )}
              </td>
              {/* Sized to its content so the buttons stay on one line. */}
              <td className={`${cell} w-px whitespace-nowrap text-right`}>
                <div className="flex justify-end">
                  <ActivityRowActions entry={entry} labels={labels.actionLabels} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

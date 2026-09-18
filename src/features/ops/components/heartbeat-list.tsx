import {utcToZurich} from "@/features/rooms/timezone";
import type {OpsHeartbeat} from "@/db/schema";
import {Panel} from "@/shared/ui/panel";
import {StatusLabel, statusRailClass} from "@/shared/ui/status-label";

export function HeartbeatList({
  rows,
  empty,
  okLabel,
  failedLabel,
}: {
  rows: OpsHeartbeat[];
  empty: string;
  okLabel: string;
  failedLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <Panel className="mt-5 max-w-xl">
        <p className="text-sm leading-7 text-ink-muted">{empty}</p>
      </Panel>
    );
  }

  return (
    <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => {
        const zurich = utcToZurich(row.createdAt);
        return (
        <li key={row.id}>
          <Panel padding="sm" className={`h-full ${statusRailClass(row.ok ? "ok" : "stop")}`}>
            <StatusLabel tone={row.ok ? "ok" : "stop"}>
              {row.ok ? okLabel : failedLabel}
            </StatusLabel>
            <p className="mt-3 font-sans text-sm font-semibold uppercase tracking-[0.08em]">
              {row.job}
            </p>
            <p className="mt-2 font-sans text-sm tabular-nums text-ink-muted">
              {`${zurich.date} ${zurich.time}`}
            </p>
            {row.error ? (
              <p className="mt-3 font-sans text-sm leading-6 text-ink-muted">{row.error}</p>
            ) : null}
          </Panel>
        </li>
        );
      })}
    </ul>
  );
}

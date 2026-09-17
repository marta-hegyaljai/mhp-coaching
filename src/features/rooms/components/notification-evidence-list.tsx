import {getTranslations} from "next-intl/server";

import {publicNotificationProjection} from "@/features/rooms/notifications";
import {Panel} from "@/shared/ui/panel";
import {StatusLabel, statusRailClass, type StatusTone} from "@/shared/ui/status-label";

type NotificationRow = ReturnType<typeof publicNotificationProjection>;

export async function NotificationEvidenceList({
  rows,
  empty,
}: {
  rows: NotificationRow[];
  empty: string;
}) {
  const t = await getTranslations("Admin");
  if (rows.length === 0) {
    return (
      <Panel className="mt-5 max-w-2xl">
        <p className="text-sm leading-7 text-ink-muted">{empty}</p>
      </Panel>
    );
  }

  return (
    <ul className="mt-5 grid gap-3">
      {rows.map((row) => (
        <li key={row.id}>
          <Panel padding="sm" className={statusRailClass(notificationStatusTone(row.status))}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <StatusLabel tone={notificationStatusTone(row.status)}>
                {t(`notificationStatus.${row.status}`)}
              </StatusLabel>
              <p className="font-sans text-xs tabular-nums text-ink-muted">
                {new Date(row.createdAt).toISOString().replace("T", " ").slice(0, 16)} UTC
              </p>
            </div>
            <p className="mt-3 text-[0.7rem] font-bold uppercase tracking-[0.2em]">
              {t(`notificationKind.${row.kind}`)}
            </p>
            <p className="mt-2 font-sans text-sm break-all">{row.toEmail}</p>
            {row.providerMessageId ? (
              <p className="mt-2 font-sans text-xs tabular-nums text-ink-muted break-all">
                {row.providerMessageId}
              </p>
            ) : null}
            {row.lastError ? (
              <p className="mt-2 font-sans text-sm text-ink-muted">{row.lastError}</p>
            ) : null}
          </Panel>
        </li>
      ))}
    </ul>
  );
}

function notificationStatusTone(status: NotificationRow["status"]): StatusTone {
  if (status === "SENT") {
    return "ok";
  }
  if (status === "FAILED") {
    return "stop";
  }
  if (status === "PENDING") {
    return "gold";
  }
  return "muted";
}

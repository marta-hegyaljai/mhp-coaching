import {getTranslations} from "next-intl/server";

import type {RoomStatementLineItem} from "@/db/schema";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import type {AppLocale} from "@/i18n/routing";
import {Panel} from "@/shared/ui/panel";
import {Price} from "@/shared/ui/price";
import {StatusLabel} from "@/shared/ui/status-label";

export async function StatementLineList({
  locale,
  lines,
  empty,
}: {
  locale: AppLocale;
  lines: RoomStatementLineItem[];
  empty: string;
}) {
  const t = await getTranslations("Rooms");
  if (lines.length === 0) {
    return <p className="mt-4 text-sm leading-7 text-ink-muted">{empty}</p>;
  }

  return (
    <ul className="mt-5 grid gap-3 sm:grid-cols-2">
      {lines.map((line) => (
        <li key={line.id}>
          <Panel padding="sm" className="h-full">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <StatusLabel tone={line.kind === "ADJUSTMENT" ? "muted" : "strong"}>
                {t(`statementLineKind.${line.kind}`)}
              </StatusLabel>
              <Price size="sm" tone={line.amountMinor === 0 ? "muted" : "strong"}>
                {formatChf(minorUnitsToFrancs(line.amountMinor), locale)}
              </Price>
            </div>
            <p className="mt-3 text-sm leading-6">{line.description}</p>
            {line.minutes > 0 ? (
              <p className="mt-2 font-sans text-sm tabular-nums text-ink-muted">
                {t("bookDuration", {minutes: line.minutes})}
              </p>
            ) : null}
            {line.reason ? (
              <p className="mt-2 text-sm leading-6 text-ink-muted">{line.reason}</p>
            ) : null}
          </Panel>
        </li>
      ))}
    </ul>
  );
}

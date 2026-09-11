import {getTranslations} from "next-intl/server";

import type {RoomStatement} from "@/db/schema";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {formatMonthYear} from "@/shared/format/calendar-date";
import {formatLocalDate} from "@/features/rooms/timezone";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import type {PathnameHref} from "@/i18n/href";
import {Panel} from "@/shared/ui/panel";
import {Price} from "@/shared/ui/price";
import {StatusLabel} from "@/shared/ui/status-label";

export async function StatementCardGrid({
  locale,
  statements,
  hrefFor,
  empty,
}: {
  locale: AppLocale;
  statements: RoomStatement[];
  hrefFor: (statement: RoomStatement) => PathnameHref;
  empty: string;
}) {
  const t = await getTranslations("Rooms");
  if (statements.length === 0) {
    return (
      <Panel className="mt-5 max-w-xl">
        <p className="text-sm leading-7 text-ink-muted">{empty}</p>
      </Panel>
    );
  }

  return (
    <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {statements.map((statement) => {
        const label = formatMonthYear(
          formatLocalDate(statement.year, statement.month, 1),
          locale,
        );
        return (
          <li key={statement.id}>
            <Link
              href={hrefFor(statement)}
              className="block h-full rounded-panel border border-ink bg-white p-5 transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <StatusLabel tone={statement.status === "FINALIZED" ? "strong" : "muted"}>
                {t(`statementStatus.${statement.status}`)}
              </StatusLabel>
              <p className="mt-3 font-serif text-[clamp(1.15rem,1.4vw,1.35rem)] capitalize leading-[1.15]">
                {label}
              </p>
              <p className="mt-3 font-sans text-sm tabular-nums text-ink-muted">
                {t("statementMinutes", {minutes: statement.billedMinutes})}
              </p>
              <p className="mt-4">
                <Price size="sm">
                  {formatChf(minorUnitsToFrancs(statement.totalMinor), locale)}
                </Price>
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

import {getTranslations} from "next-intl/server";

import type {RoomStatement} from "@/db/schema";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {formatMonthYear} from "@/shared/format/calendar-date";
import {formatLocalDate} from "@/features/rooms/timezone";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {Panel} from "@/shared/ui/panel";
import {SectionLabel} from "@/shared/ui/section-label";

export async function BillingSettleBanner({
  locale,
  statements,
}: {
  locale: AppLocale;
  statements: RoomStatement[];
}) {
  const t = await getTranslations("Rooms");
  if (statements.length === 0) {
    return null;
  }

  return (
    <Panel tone="shell" padding="sm" className="mt-8 max-w-3xl border-ink">
      <SectionLabel>{t("billingSettleTitle")}</SectionLabel>
      <p className="mt-3 text-sm leading-7 text-ink">
        {t("billingSettleReminder", {count: statements.length})}
      </p>
      <p className="mt-2 text-sm leading-6 text-ink-muted">{t("billingSettleHelp")}</p>
      <ul className="mt-4 space-y-2 text-sm">
        {statements.map((statement) => {
          const label = formatMonthYear(
            formatLocalDate(statement.year, statement.month, 1),
            locale,
          );
          return (
            <li key={statement.id}>
              <Link
                href={{pathname: "/billing/statements/[id]", params: {id: statement.id}}}
                className="inline-flex flex-wrap items-baseline gap-x-2 underline-offset-4 hover:underline"
              >
                <span className="capitalize">{label}</span>
                <span className="font-sans tabular-nums text-ink-muted">
                  {formatChf(minorUnitsToFrancs(statement.totalMinor), locale)} ·{" "}
                  {t(`statementStatus.${statement.status}`)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

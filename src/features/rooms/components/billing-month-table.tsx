import {getTranslations} from "next-intl/server";

import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import type {BillingMonthRow} from "@/features/rooms/billing-overview";
import {formatMonthYear} from "@/shared/format/calendar-date";
import {formatLocalDate} from "@/features/rooms/timezone";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {Price} from "@/shared/ui/price";
import {StatusLabel} from "@/shared/ui/status-label";

const rowGridClass =
  "grid w-full grid-cols-[minmax(0,2fr)_minmax(0,1.25fr)_4.5rem_4.5rem_6.5rem] items-center gap-x-3 px-3 py-3";

function formatHours(minutes: number): string {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}` : hours.toFixed(1);
}

function statusLabel(
  row: BillingMonthRow,
  t: Awaited<ReturnType<typeof getTranslations<"Rooms">>>,
): string {
  if (row.kind === "statement" && row.statementStatus) {
    return t(`statementStatus.${row.statementStatus}`);
  }
  if (row.kind === "open") {
    return t("billingMonthOpen");
  }
  if (row.kind === "projected") {
    return t("billingMonthProjected");
  }
  return t("billingMonthAwaiting");
}

function statusTone(row: BillingMonthRow): "strong" | "muted" {
  if (row.statementStatus === "PAID") {
    return "muted";
  }
  if (row.statementStatus === "PAYMENT_FAILED") {
    return "strong";
  }
  if (row.kind === "open" || row.kind === "projected") {
    return "strong";
  }
  return "muted";
}

export async function BillingMonthTable({
  locale,
  rows,
  empty,
}: {
  locale: AppLocale;
  rows: BillingMonthRow[];
  empty: string;
}) {
  const t = await getTranslations("Rooms");

  if (rows.length === 0) {
    return <p className="mt-6 text-sm leading-7 text-ink-muted">{empty}</p>;
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-[40rem] w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-ink">
            <th colSpan={5} scope="colgroup" className="p-0">
              <div className={`${rowGridClass} font-semibold uppercase tracking-[0.08em]`}>
                <span>{t("billingMonthColumn")}</span>
                <span>{t("billingStatusColumn")}</span>
                <span className="text-right">{t("billingHoursColumn")}</span>
                <span className="text-right">{t("billingBookingsColumn")}</span>
                <span className="text-right">{t("billingTotalColumn")}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const monthLabel = formatMonthYear(
              formatLocalDate(row.year, row.month, 1),
              locale,
            );

            return (
              <tr key={row.monthKey} className="border-b border-line-soft">
                <td colSpan={5} className="p-0">
                  <Link
                    href={row.href}
                    aria-label={`${monthLabel} · ${statusLabel(row, t)}`}
                    className={`${rowGridClass} transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink`}
                  >
                    <span>
                      <span className="block font-serif text-base capitalize leading-tight">
                        {monthLabel}
                      </span>
                      {row.isCurrentMonth ? (
                        <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">
                          {t("billingCurrentMonth")}
                        </span>
                      ) : null}
                    </span>
                    <span>
                      <StatusLabel tone={statusTone(row)}>{statusLabel(row, t)}</StatusLabel>
                    </span>
                    <span className="text-right font-sans tabular-nums">
                      {formatHours(row.billedMinutes)}
                    </span>
                    <span className="text-right font-sans tabular-nums">{row.bookingCount}</span>
                    <span className="text-right">
                      <Price size="sm" tone={row.billedAmountMinor > 0 ? "strong" : "muted"}>
                        {formatChf(minorUnitsToFrancs(row.billedAmountMinor), locale)}
                      </Price>
                    </span>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

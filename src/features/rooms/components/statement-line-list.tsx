import {getTranslations} from "next-intl/server";

import type {RoomStatementLineItem} from "@/db/schema";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
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
    <div className="mt-5 overflow-x-auto">
      <table className="min-w-[44rem] w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-ink">
            <th scope="col" className="px-3 py-3 font-semibold uppercase tracking-[0.08em]">
              {t("billingLineOutcomeColumn")}
            </th>
            <th scope="col" className="px-3 py-3 font-semibold uppercase tracking-[0.08em]">
              {t("billingLineDescriptionColumn")}
            </th>
            <th scope="col" className="px-3 py-3 text-right font-semibold uppercase tracking-[0.08em]">
              {t("billingDurationColumn")}
            </th>
            <th scope="col" className="px-3 py-3 text-right font-semibold uppercase tracking-[0.08em]">
              {t("billingTotalColumn")}
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-b border-line-soft">
              <td className="px-3 py-3 align-middle">
                <StatusLabel tone={line.kind === "ADJUSTMENT" ? "muted" : "strong"}>
                  {t(`statementLineKind.${line.kind}`)}
                </StatusLabel>
              </td>
              <td className="px-3 py-3 align-middle">
                {line.bookingId ? (
                  <Link
                    href={{pathname: "/rooms/bookings/[id]", params: {id: line.bookingId}}}
                    className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    {line.description}
                  </Link>
                ) : (
                  <span>{line.description}</span>
                )}
                {line.reason ? (
                  <span className="mt-1 block text-sm leading-6 text-ink-muted">{line.reason}</span>
                ) : null}
              </td>
              <td className="px-3 py-3 text-right align-middle font-sans tabular-nums">
                {line.minutes > 0 ? t("bookDuration", {minutes: line.minutes}) : "—"}
              </td>
              <td className="px-3 py-3 text-right align-middle">
                <Price size="sm" tone={line.amountMinor === 0 ? "muted" : "strong"}>
                  {formatChf(minorUnitsToFrancs(line.amountMinor), locale)}
                </Price>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

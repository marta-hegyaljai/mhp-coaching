import {getTranslations} from "next-intl/server";

import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {billingCopyKey} from "@/features/rooms/billing";
import {bookingWhen} from "@/features/rooms/format";
import type {UsageLine} from "@/features/rooms/usage";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {Price} from "@/shared/ui/price";
import {StatusLabel} from "@/shared/ui/status-label";

export async function UsageLineTable({
  locale,
  lines,
  empty,
  hrefForLine,
}: {
  locale: AppLocale;
  lines: UsageLine[];
  empty: string;
  hrefForLine?: (line: UsageLine) => {pathname: "/rooms/bookings/[id]"; params: {id: string}};
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
              {t("bookRoom")}
            </th>
            <th scope="col" className="px-3 py-3 font-semibold uppercase tracking-[0.08em]">
              {t("billingLineDateColumn")}
            </th>
            <th scope="col" className="px-3 py-3 font-semibold uppercase tracking-[0.08em]">
              {t("billingLineOutcomeColumn")}
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
          {lines.map((line) => {
            const when = bookingWhen(line.startsAt, line.endsAt, locale);
            const href = hrefForLine?.(line);
            const roomCell = href ? (
              <Link
                href={href}
                className="font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {line.roomName}
              </Link>
            ) : (
              <span className="font-semibold">{line.roomName}</span>
            );

            return (
              <tr key={line.bookingId} className="border-b border-line-soft">
                <td className="px-3 py-3 align-middle">{roomCell}</td>
                <td className="px-3 py-3 align-middle">
                  <span className="block">{when.dateLabel}</span>
                  <span className="mt-0.5 block font-sans tabular-nums text-ink-muted">
                    {when.timeLabel}
                  </span>
                </td>
                <td className="px-3 py-3 align-middle">
                  <StatusLabel tone={line.billedAmountMinor > 0 ? "strong" : "muted"}>
                    {t(billingCopyKey(line))}
                  </StatusLabel>
                </td>
                <td className="px-3 py-3 text-right align-middle font-sans tabular-nums">
                  {t("bookDuration", {minutes: line.durationMinutes})}
                </td>
                <td className="px-3 py-3 text-right align-middle">
                  <Price size="sm" tone={line.billedAmountMinor > 0 ? "strong" : "muted"}>
                    {formatChf(minorUnitsToFrancs(line.billedAmountMinor), locale)}
                  </Price>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

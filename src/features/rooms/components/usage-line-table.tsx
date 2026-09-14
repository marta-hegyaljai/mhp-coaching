import {getTranslations} from "next-intl/server";

import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {billingCopyKey} from "@/features/rooms/billing";
import {bookingWhen} from "@/features/rooms/format";
import type {UsageLine} from "@/features/rooms/usage";
import type {PathnameHref} from "@/i18n/href";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {Price} from "@/shared/ui/price";
import {StatusLabel} from "@/shared/ui/status-label";

type UsageLineHref = Extract<
  PathnameHref,
  {pathname: "/rooms/bookings/[id]"} | {pathname: "/admin/bookings/[id]"}
>;

export async function UsageLineTable({
  locale,
  lines,
  empty,
  hrefForLine,
  embedded = false,
}: {
  locale: AppLocale;
  lines: UsageLine[];
  empty: string;
  hrefForLine?: (line: UsageLine) => UsageLineHref;
  /** When true, the table sits inside a parent panel that already owns the border. */
  embedded?: boolean;
}) {
  const t = await getTranslations("Rooms");

  if (lines.length === 0) {
    return embedded ? (
      <p className="px-4 py-10 text-center text-sm leading-7 text-ink-muted">{empty}</p>
    ) : (
      <p className="mt-4 text-sm leading-7 text-ink-muted">{empty}</p>
    );
  }

  const shellClass = embedded
    ? "overflow-x-auto"
    : "mt-5 overflow-x-auto rounded-panel border border-ink";

  return (
    <div className={shellClass}>
      <table className="min-w-[44rem] w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-[0.14em] text-ink-subtle">
            <th scope="col" className="px-4 py-3 font-medium">
              {t("bookRoom")}
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              {t("billingLineDateColumn")}
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              {t("billingLineOutcomeColumn")}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              {t("billingDurationColumn")}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              {t("billingTotalColumn")}
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const when = bookingWhen(line.startsAt, line.endsAt, locale);
            const href = hrefForLine?.(line);

            return (
              <tr
                key={line.bookingId}
                className="relative border-b border-line-soft last:border-b-0 transition-colors duration-150 ease-standard hover:bg-hover has-[a:focus-visible]:bg-hover"
              >
                <td className="px-4 py-3 align-top text-ink">
                  {href ? (
                    <Link
                      href={href}
                      className="rounded-panel font-medium after:absolute after:inset-0 focus-visible:outline-none"
                    >
                      <span className="sr-only">{t("openBooking")}: </span>
                      {line.roomName}
                    </Link>
                  ) : (
                    <span className="font-medium">{line.roomName}</span>
                  )}
                  {line.discountPercent > 0 ? (
                    <span className="mt-1 block text-xs leading-5 text-ink-muted">
                      {t("bookDiscount", {percent: line.discountPercent})}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 align-top">
                  <span className="block font-sans font-semibold tabular-nums text-ink">
                    {when.timeLabel}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-ink-muted">
                    {when.dateLabel}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  <StatusLabel tone={line.billedAmountMinor > 0 ? "strong" : "muted"}>
                    {t(billingCopyKey(line))}
                  </StatusLabel>
                </td>
                <td className="px-4 py-3 align-top text-right font-sans tabular-nums text-ink">
                  {t("bookDuration", {minutes: line.durationMinutes})}
                </td>
                <td className="px-4 py-3 align-top text-right whitespace-nowrap">
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

import {getTranslations} from "next-intl/server";

import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {bookingWhen} from "@/features/rooms/format";
import {billingCopyKey} from "@/features/rooms/billing";
import type {UsageLine, UserUsage} from "@/features/rooms/usage";
import {formatMonthYear} from "@/shared/format/calendar-date";
import {formatLocalDate} from "@/features/rooms/timezone";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {Price} from "@/shared/ui/price";
import {Panel} from "@/shared/ui/panel";
import {SectionLabel} from "@/shared/ui/section-label";
import {StatusLabel} from "@/shared/ui/status-label";

export async function UsageMonthBanner({
  locale,
  year,
  month,
  open = true,
}: {
  locale: AppLocale;
  year: number;
  month: number;
  open?: boolean;
}) {
  const t = await getTranslations("Rooms");
  const label = formatMonthYear(formatLocalDate(year, month, 1), locale);

  return (
    <Panel tone="shell" padding="sm" className="mt-8 max-w-2xl">
      <StatusLabel tone={open ? "strong" : "muted"}>
        {open ? t("usageOpenLabel") : t("usageClosedLabel")}
      </StatusLabel>
      <p className="mt-2 font-serif text-subheading capitalize">{label}</p>
      <p className="mt-2 text-sm leading-6 text-ink-muted">
        {open ? t("usageOpenHelp") : t("usageClosedHelp")}
      </p>
    </Panel>
  );
}

export async function UsageTotals({
  locale,
  billedMinutes,
  billedAmountMinor,
  bookingCount,
}: {
  locale: AppLocale;
  billedMinutes: number;
  billedAmountMinor: number;
  bookingCount: number;
}) {
  const t = await getTranslations("Rooms");

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-3">
      <UsageStat label={t("usageMinutes")} value={`${billedMinutes}`} />
      <UsageStat
        label={t("usageAmount")}
        value={formatChf(minorUnitsToFrancs(billedAmountMinor), locale)}
        price
      />
      <UsageStat label={t("usageBookings")} value={`${bookingCount}`} />
    </div>
  );
}

function UsageStat({
  label,
  value,
  price = false,
}: {
  label: string;
  value: string;
  price?: boolean;
}) {
  return (
    <Panel padding="sm">
      <SectionLabel>{label}</SectionLabel>
      <p className="mt-3">
        {price ? (
          <Price size="md">{value}</Price>
        ) : (
          <span className="font-sans text-xl font-semibold tabular-nums tracking-tight">{value}</span>
        )}
      </p>
    </Panel>
  );
}

export async function UsageRoomGrid({
  locale,
  rooms,
}: {
  locale: AppLocale;
  rooms: UserUsage["rooms"];
}) {
  const t = await getTranslations("Rooms");
  if (rooms.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <h2 className="font-serif text-subheading">{t("usageByRoom")}</h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <li key={room.roomId}>
            <Panel padding="sm" className="h-full">
              <h3 className="font-serif text-[clamp(1.15rem,1.4vw,1.35rem)] leading-[1.15]">
                {room.roomName}
              </h3>
              <p className="mt-3 font-sans text-sm tabular-nums leading-6 text-ink-muted">
                {t("usageRoomMeta", {
                  minutes: room.billedMinutes,
                  count: room.bookingCount,
                })}
              </p>
              <p className="mt-4">
                <Price size="sm">
                  {formatChf(minorUnitsToFrancs(room.billedAmountMinor), locale)}
                </Price>
              </p>
            </Panel>
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function UsageLineList({
  locale,
  lines,
  empty,
  hrefForLine,
}: {
  locale: AppLocale;
  lines: UsageLine[];
  empty: string;
  hrefForLine?: (line: UsageLine) => {pathname: "/rooms/bookings/[id]"; params: {id: string}} | {pathname: "/admin/bookings/[id]"; params: {id: string}};
}) {
  const t = await getTranslations("Rooms");

  return (
    <section className="mt-12">
      <h2 className="font-serif text-subheading">{t("usageBreakdown")}</h2>
      {lines.length === 0 ? (
        <p className="mt-4 text-sm leading-7 text-ink-muted">{empty}</p>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {lines.map((line) => {
            const when = bookingWhen(line.startsAt, line.endsAt, locale);
            const body = (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                  <StatusLabel tone={line.billedAmountMinor > 0 ? "strong" : "muted"}>
                    {t(billingCopyKey(line))}
                  </StatusLabel>
                  <Price size="sm" tone={line.billedAmountMinor > 0 ? "strong" : "muted"}>
                    {formatChf(minorUnitsToFrancs(line.billedAmountMinor), locale)}
                  </Price>
                </div>
                <h3 className="mt-3 font-serif text-[clamp(1.15rem,1.4vw,1.35rem)] leading-[1.15]">
                  {line.roomName}
                </h3>
                <p className="mt-3 text-sm leading-6 text-ink-muted">{when.dateLabel}</p>
                <p className="mt-1 font-sans text-sm tabular-nums leading-6 text-ink-muted">
                  {when.timeLabel} · {t("bookDuration", {minutes: line.durationMinutes})}
                </p>
                {line.discountPercent > 0 ? (
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {t("bookDiscount", {percent: line.discountPercent})}
                  </p>
                ) : null}
              </>
            );

            const href = hrefForLine?.(line);
            return (
              <li key={line.bookingId}>
                {href ? (
                  <Link
                    href={href}
                    className="block h-full rounded-panel border border-ink bg-white p-5 transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    {body}
                  </Link>
                ) : (
                  <Panel padding="sm" className="h-full">
                    {body}
                  </Panel>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

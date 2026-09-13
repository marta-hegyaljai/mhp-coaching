import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";

import {requireRoomBooking} from "@/features/auth/require";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {loadOwnBillingOverview} from "@/features/rooms/billing-overview";
import {UsageLineTable} from "@/features/rooms/components/usage-line-table";
import {RoomsNav} from "@/features/rooms/components/rooms-nav";
import {loadOwnMonthUsage} from "@/features/rooms/usage";
import {findStatementForUserMonth, isFinalizedStatus} from "@/features/rooms/statement-repository";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {formatMonthYear} from "@/shared/format/calendar-date";
import {formatLocalDate, parseZurichMonthKey} from "@/features/rooms/timezone";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Price} from "@/shared/ui/price";
import {StatusLabel} from "@/shared/ui/status-label";

type BillingMonthPageProps = {
  params: Promise<{locale: AppLocale; year: string; month: string}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: BillingMonthPageProps) {
  const {locale, year, month} = await params;
  const t = await getTranslations({locale, namespace: "Rooms"});
  const monthLabel = formatMonthYear(formatLocalDate(Number(year), Number(month), 1), locale);

  return buildPageMetadata({
    locale,
    title: `${t("billingMonthTitle")} — ${monthLabel}`,
    description: t("billingOverviewHelp"),
    hrefForLocale: () => "/billing",
    robots: {index: false, follow: false},
  });
}

export default async function BillingMonthPage({params}: BillingMonthPageProps) {
  const {locale, year: yearRaw, month: monthRaw} = await params;
  setRequestLocale(locale);
  const user = await requireRoomBooking(
    locale,
    localizedPath(locale, {
      pathname: "/billing/[year]/[month]",
      params: {year: yearRaw, month: monthRaw},
    }),
  );
  const t = await getTranslations("Rooms");

  let month;
  try {
    month = parseZurichMonthKey(`${yearRaw}-${monthRaw.padStart(2, "0")}`);
  } catch {
    notFound();
  }

  const [usage, statement, overview] = await Promise.all([
    loadOwnMonthUsage(user, month),
    findStatementForUserMonth(user.id, month),
    loadOwnBillingOverview(user),
  ]);
  const row = overview.rows.find(
    (candidate) => candidate.year === month.year && candidate.month === month.month,
  );
  if (!row && usage.bookingCount === 0) {
    notFound();
  }

  const monthLabel = formatMonthYear(formatLocalDate(month.year, month.month, 1), locale);
  const intro =
    row?.kind === "projected"
      ? t("billingMonthIntroProjected")
      : row?.kind === "awaiting_statement"
        ? t("billingMonthIntroAwaiting")
        : t("billingMonthIntroOpen");

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <RoomsNav current="usage" />
        <p className="mt-6 text-sm">
          <Link href="/billing" className="underline-offset-4 hover:underline">
            {t("backToBilling")}
          </Link>
        </p>
        <h1 className="mt-3 font-serif text-heading capitalize">{monthLabel}</h1>
        {row ? (
          <StatusLabel className="mt-4" tone={row.kind === "open" ? "strong" : "muted"}>
            {row.kind === "statement" && row.statementStatus
              ? t(`statementStatus.${row.statementStatus}`)
              : t(
                  row.kind === "open"
                    ? "billingMonthOpen"
                    : row.kind === "projected"
                      ? "billingMonthProjected"
                      : "billingMonthAwaiting",
                )}
          </StatusLabel>
        ) : null}
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-muted">{intro}</p>

        <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
          <span>
            {t("billingHoursColumn")}:{" "}
            <span className="font-sans font-semibold tabular-nums">
              {usage.billedMinutes / 60}
            </span>
          </span>
          <span>
            {t("billingBookingsColumn")}:{" "}
            <span className="font-sans font-semibold tabular-nums">{usage.bookingCount}</span>
          </span>
          <Price size="md">
            {formatChf(minorUnitsToFrancs(usage.billedAmountMinor), locale)}
          </Price>
        </div>

        {statement && isFinalizedStatus(statement.status) ? (
          <p className="mt-4 text-sm">
            <Link
              href={{pathname: "/billing/statements/[id]", params: {id: statement.id}}}
              className="underline-offset-4 hover:underline"
            >
              {t("billingViewStatement")}
            </Link>
          </p>
        ) : null}

        <section className="mt-10">
          <h2 className="font-serif text-subheading">{t("usageBreakdown")}</h2>
          <UsageLineTable
            locale={locale}
            lines={usage.lines}
            empty={t("usageEmpty")}
            hrefForLine={(line) => ({
              pathname: "/rooms/bookings/[id]",
              params: {id: line.bookingId},
            })}
          />
        </section>
      </Section>
    </SiteShell>
  );
}

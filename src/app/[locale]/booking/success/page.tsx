import {getTranslations, setRequestLocale} from "next-intl/server";
import type {ReactNode} from "react";

import {getBookingById} from "@/features/bookings/repository";
import {formatDateRange} from "@/features/courses/dates";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {buildPageMetadata} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {CheckIcon} from "@/shared/ui/icons";
import {Section} from "@/shared/ui/layout";

type SuccessPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{bookingId?: string}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: SuccessPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "BookingSuccess"});

  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("intro"),
    hrefForLocale: () => "/booking/success",
    robots: {index: false, follow: false},
  });
}

export default async function BookingSuccessPage({
  params,
  searchParams,
}: SuccessPageProps) {
  const {locale} = await params;
  const {bookingId} = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("BookingSuccess");
  const booking = bookingId ? await getBookingById(bookingId) : undefined;
  const paid = booking?.status === "PAID";

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="md">
        <div className="max-w-3xl">
          <p
            className={`inline-flex items-center gap-2 rounded-panel border px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] ${
              paid
                ? "border-bronze/40 bg-parchment text-bronze"
                : "border-line bg-parchment text-ink-subtle"
            }`}
          >
            {paid ? <CheckIcon className="h-3.5 w-3.5" /> : null}
            {paid ? t("statusPaid") : t("statusPending")}
          </p>

          <h1 className="mt-6 font-serif text-title">
            {paid ? t("title") : t("pendingTitle")}
          </h1>
          <p className="mt-5 text-lead text-ink-muted">
            {paid ? t("intro") : t("pendingIntro")}
          </p>

          {booking ? (
            <dl className="mt-10 divide-y divide-line-soft rounded-panel border border-line bg-parchment px-6">
              <SummaryRow label={t("course")}>{booking.courseTitle}</SummaryRow>
              <SummaryRow label={t("dates")}>
                {formatDateRange(
                  booking.courseDateStart,
                  booking.courseDateEnd,
                  locale,
                )}
              </SummaryRow>
              <SummaryRow label={t("location")}>{booking.location}</SummaryRow>
              <SummaryRow label={t("amount")}>
                {formatChf(minorUnitsToFrancs(booking.amountMinor), locale)}
              </SummaryRow>
              <SummaryRow label={t("reference")}>
                <span className="font-mono text-xs break-all">{booking.id}</span>
              </SummaryRow>
            </dl>
          ) : null}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className={`${buttonStyles({size: "lg"})} w-full sm:w-auto`}
            >
              {t("backHome")}
            </Link>
            <Link
              href="/courses"
              className={`${buttonStyles({variant: "secondary", size: "lg"})} w-full sm:w-auto`}
            >
              {t("coursesCta")}
            </Link>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}

function SummaryRow({label, children}: {label: string; children: ReactNode}) {
  return (
    <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">
        {label}
      </dt>
      <dd className="text-sm text-ink sm:text-right">{children}</dd>
    </div>
  );
}

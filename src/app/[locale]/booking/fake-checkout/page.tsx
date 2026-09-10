import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {getBookingById} from "@/features/bookings/repository";
import {isValidFakeCheckoutToken} from "@/features/payments/fake";
import {getConfiguredPaymentProviderName} from "@/features/payments/types";
import {FakeCheckoutPanel} from "@/features/payments/fake/checkout-panel";
import {buildPageMetadata} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import type {AppLocale} from "@/i18n/routing";
import {Section} from "@/shared/ui/layout";

type FakeCheckoutPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{bookingId?: string; token?: string}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: FakeCheckoutPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "FakeCheckout"});

  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("intro"),
    hrefForLocale: () => "/booking/fake-checkout",
    robots: {index: false, follow: false},
  });
}

export default async function FakeCheckoutPage({
  params,
  searchParams,
}: FakeCheckoutPageProps) {
  const {locale} = await params;
  const {bookingId, token} = await searchParams;
  setRequestLocale(locale);

  if (getConfiguredPaymentProviderName() !== "fake") {
    notFound();
  }

  if (!bookingId || !token || !isValidFakeCheckoutToken(bookingId, token)) {
    notFound();
  }

  const booking = await getBookingById(bookingId);

  if (!booking) {
    notFound();
  }

  const t = await getTranslations("FakeCheckout");

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="md">
        <p className="inline-flex items-center rounded-panel border border-ink bg-parchment px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink">
          {t("badge")}
        </p>
        <h1 className="mt-6 font-serif text-title">{t("title")}</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-ink-muted">
          {t("intro")}
        </p>
        <div className="mt-10">
          <FakeCheckoutPanel
            booking={booking}
            token={token}
            locale={locale}
            payLabel={t("pay")}
            failLabel={t("fail")}
            cancelLabel={t("cancel")}
            amountLabel={t("amount", {
              amount: formatChf(minorUnitsToFrancs(booking.amountMinor), locale),
            })}
          />
        </div>
      </Section>
    </SiteShell>
  );
}

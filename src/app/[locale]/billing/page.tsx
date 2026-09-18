import {getTranslations, setRequestLocale} from "next-intl/server";

import {requireRoomBooking} from "@/features/auth/require";
import {loadOwnBillingOverview} from "@/features/rooms/billing-overview";
import {BillingMonthTable} from "@/features/rooms/components/billing-month-table";
import {BillingSettleBanner} from "@/features/rooms/components/billing-settle-banner";
import {PaymentMethodPanel} from "@/features/rooms/components/payment-method-panel";
import {RoomsNav} from "@/features/rooms/components/rooms-nav";
import {savedPaymentMethodFor} from "@/features/rooms/payment-method";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {WorkspacePage} from "@/shared/ui/workspace-page";

type BillingPageProps = {
  params: Promise<{locale: AppLocale}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: BillingPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Rooms"});

  return buildPageMetadata({
    locale,
    title: t("usageTitle"),
    description: t("usageIntro"),
    hrefForLocale: () => "/billing",
    robots: {index: false, follow: false},
  });
}

export default async function BillingPage({params}: BillingPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const user = await requireRoomBooking(locale, localizedPath(locale, "/billing"));
  const t = await getTranslations("Rooms");
  const overview = await loadOwnBillingOverview(user);
  const paymentMethod = savedPaymentMethodFor(user);

  return (
    <SiteShell locale={locale} footerCta={null}>
      <WorkspacePage
        eyebrow={t("eyebrow")}
        nav={<RoomsNav current="usage" />}
        title={t("usageTitle")}
        intro={t("usageIntro")}
      >

        <BillingSettleBanner locale={locale} statements={overview.unsettledStatements} />

        <section className="mt-10">
          <h2 className="font-serif text-subheading">{t("billingOverviewTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
            {t("billingOverviewHelp")}
          </p>
          <BillingMonthTable
            locale={locale}
            rows={overview.rows}
            empty={t("billingOverviewEmpty")}
          />
        </section>

        <div className="mt-12 max-w-xl">
          <PaymentMethodPanel method={paymentMethod} locale={locale} />
        </div>
      </WorkspacePage>
    </SiteShell>
  );
}

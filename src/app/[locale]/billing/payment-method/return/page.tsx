import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound, redirect} from "next/navigation";

import {requireRoomBooking} from "@/features/auth/require";
import {getConfiguredPaymentProviderName} from "@/features/payments/types";
import {paymentMethodFromSetupSession} from "@/features/payments/stripe/billing-setup";
import {applyStripePaymentMethodSetup} from "@/features/rooms/payment-method";
import {localizedPathname} from "@/i18n/path";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Panel} from "@/shared/ui/panel";

type ReturnPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{session_id?: string}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: ReturnPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Rooms"});

  return buildPageMetadata({
    locale,
    title: t("paymentMethodReturnTitle"),
    description: t("paymentMethodHelp"),
    hrefForLocale: () => "/billing/payment-method/return",
    robots: {index: false, follow: false},
  });
}

export default async function PaymentMethodReturnPage({params, searchParams}: ReturnPageProps) {
  const {locale} = await params;
  const {session_id: sessionId} = await searchParams;
  setRequestLocale(locale);
  const user = await requireRoomBooking(
    locale,
    localizedPath(locale, "/billing/payment-method/return"),
  );
  const t = await getTranslations("Rooms");

  if (getConfiguredPaymentProviderName() !== "stripe") {
    redirect(localizedPathname(locale, "/billing"));
  }

  if (!sessionId) {
    notFound();
  }

  const setup = await paymentMethodFromSetupSession(sessionId);
  if (setup && setup.userId === user.id) {
    await applyStripePaymentMethodSetup({
      userId: user.id,
      method: setup.method,
    });
    redirect(localizedPathname(locale, "/billing"));
  }

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="mt-3 font-serif text-heading">{t("paymentMethodReturnTitle")}</h1>
        <Panel className="mt-8 max-w-xl">
          <p className="text-sm leading-7 text-ink-muted">{t("paymentMethodReturnFailed")}</p>
          <p className="mt-4">
            <Link href="/billing" className="text-sm font-semibold underline-offset-4 hover:underline">
              {t("backToBilling")}
            </Link>
          </p>
        </Panel>
      </Section>
    </SiteShell>
  );
}

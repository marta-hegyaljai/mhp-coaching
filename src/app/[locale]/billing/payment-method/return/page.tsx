import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound, redirect} from "next/navigation";

import {requireRoomBooking} from "@/features/auth/require";
import {getConfiguredPaymentProviderName} from "@/features/payments/types";
import {paymentMethodFromSetupSession} from "@/features/payments/stripe/billing-setup";
import {applyStripePaymentMethodSetup} from "@/features/rooms/payment-method";
import {localizedPathname} from "@/i18n/path";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {RoomsWorkspace} from "@/features/rooms/components/rooms-workspace";
import type {AppLocale} from "@/i18n/routing";
import {BackLink} from "@/shared/ui/back-link";
import {Panel} from "@/shared/ui/panel";
import {WorkspacePage} from "@/shared/ui/workspace-page";

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
    <RoomsWorkspace locale={locale} current="usage">
      <WorkspacePage
        back={<BackLink href="/billing">{t("backToBilling")}</BackLink>}
        title={t("paymentMethodReturnTitle")}
      >
        <Panel className="mt-6 max-w-xl">
          <p className="text-sm leading-6 text-ink-muted">{t("paymentMethodReturnFailed")}</p>
        </Panel>
      </WorkspacePage>
    </RoomsWorkspace>
  );
}

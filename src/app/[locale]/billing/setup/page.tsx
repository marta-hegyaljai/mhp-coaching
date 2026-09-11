import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {requireRoomBooking} from "@/features/auth/require";
import {completeFakePaymentMethodAction} from "@/features/rooms/billing-actions";
import {isValidFakeBillingSetupToken} from "@/features/payments/fake/billing-setup";
import {FAKE_CARD} from "@/features/payments/fake/billing-setup";
import {getConfiguredPaymentProviderName} from "@/features/payments/types";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {Button} from "@/shared/ui/button";
import {Section} from "@/shared/ui/layout";
import {Panel} from "@/shared/ui/panel";

type FakeBillingSetupPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{userId?: string; token?: string}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: FakeBillingSetupPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Rooms"});

  return buildPageMetadata({
    locale,
    title: t("fakeSetupTitle"),
    description: t("fakeSetupIntro"),
    hrefForLocale: () => "/billing/setup",
    robots: {index: false, follow: false},
  });
}

export default async function FakeBillingSetupPage({
  params,
  searchParams,
}: FakeBillingSetupPageProps) {
  const {locale} = await params;
  const {userId, token} = await searchParams;
  setRequestLocale(locale);

  if (getConfiguredPaymentProviderName() !== "fake") {
    notFound();
  }

  const user = await requireRoomBooking(locale, localizedPath(locale, "/billing/setup"));
  if (!userId || !token || !isValidFakeBillingSetupToken(userId, token) || user.id !== userId) {
    notFound();
  }

  const t = await getTranslations("Rooms");

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="md">
        <p className="inline-flex items-center rounded-panel border border-ink bg-parchment px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink">
          {t("fakeSetupBadge")}
        </p>
        <h1 className="mt-6 font-serif text-title">{t("fakeSetupTitle")}</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-ink-muted">{t("fakeSetupIntro")}</p>
        <Panel className="mt-10 max-w-lg">
          <p className="font-sans text-sm tabular-nums leading-6">
            {t("fakeSetupCard", {
              brand: "Visa",
              last4: FAKE_CARD.last4,
              exp: `${FAKE_CARD.expMonth}/${FAKE_CARD.expYear}`,
            })}
          </p>
          <form action={completeFakePaymentMethodAction} className="mt-8">
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" size="lg" block>
              {t("fakeSetupConfirm")}
            </Button>
          </form>
        </Panel>
      </Section>
    </SiteShell>
  );
}

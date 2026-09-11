import {getTranslations, setRequestLocale} from "next-intl/server";

import {requireRoomBooking} from "@/features/auth/require";
import {RoomsNav} from "@/features/rooms/components/rooms-nav";
import {
  UsageLineList,
  UsageMonthBanner,
  UsageRoomGrid,
  UsageTotals,
} from "@/features/rooms/components/usage-panels";
import {loadOwnOpenMonthUsage} from "@/features/rooms/usage";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Panel} from "@/shared/ui/panel";

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
  const usage = await loadOwnOpenMonthUsage(user);

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="mt-3 font-serif text-heading">{t("usageTitle")}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-muted">{t("usageIntro")}</p>
        <RoomsNav current="usage" />
        <UsageMonthBanner locale={locale} year={usage.month.year} month={usage.month.month} />
        {usage.bookingCount === 0 ? (
          <Panel className="mt-10 max-w-xl">
            <p className="text-sm leading-7 text-ink-muted">{t("usageEmpty")}</p>
          </Panel>
        ) : (
          <>
            <UsageTotals
              locale={locale}
              billedMinutes={usage.billedMinutes}
              billedAmountMinor={usage.billedAmountMinor}
              bookingCount={usage.bookingCount}
            />
            <UsageRoomGrid locale={locale} rooms={usage.rooms} />
            <UsageLineList
              locale={locale}
              lines={usage.lines}
              empty={t("usageEmpty")}
              hrefForLine={(line) => ({
                pathname: "/rooms/bookings/[id]",
                params: {id: line.bookingId},
              })}
            />
          </>
        )}
      </Section>
    </SiteShell>
  );
}

import {getTranslations, setRequestLocale} from "next-intl/server";

import {requireRoomBooking} from "@/features/auth/require";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

type RoomsPageProps = {
  params: Promise<{locale: AppLocale}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: RoomsPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Rooms"});

  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("intro"),
    hrefForLocale: () => "/rooms",
    robots: {index: false, follow: false},
  });
}

export default async function RoomsPage({params}: RoomsPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  await requireRoomBooking(locale, localizedPath(locale, "/rooms"));
  const t = await getTranslations("Rooms");

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="mt-3 font-serif text-heading">{t("title")}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-muted">{t("intro")}</p>
      </Section>
    </SiteShell>
  );
}

import {getTranslations, setRequestLocale} from "next-intl/server";

import {requireRoomBooking} from "@/features/auth/require";
import {therapistAvailability} from "@/features/rooms/availability";
import {AvailabilityCalendar} from "@/features/rooms/components/availability/calendar";
import {RoomsNav} from "@/features/rooms/components/rooms-nav";
import {parseAvailabilityQuery} from "@/features/rooms/query";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

type RoomsPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{
    view?: string | string[];
    date?: string | string[];
    room?: string | string[];
  }>;
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

export default async function RoomsPage({params, searchParams}: RoomsPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const user = await requireRoomBooking(locale, localizedPath(locale, "/rooms"));
  const t = await getTranslations("Rooms");
  const query = parseAvailabilityQuery(await searchParams);
  const availability = await therapistAvailability({
    actor: user,
    view: query.view,
    date: query.date,
    roomId: query.roomId,
  });

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="mt-3 font-serif text-heading">{t("title")}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-muted">{t("intro")}</p>
        <RoomsNav current="calendar" />
        <div className="mt-10">
          <AvailabilityCalendar
            locale={locale}
            query={query}
            availability={availability}
          />
        </div>
      </Section>
    </SiteShell>
  );
}

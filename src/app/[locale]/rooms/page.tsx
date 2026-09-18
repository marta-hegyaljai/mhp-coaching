import {getTranslations, setRequestLocale} from "next-intl/server";

import {requireRoomBooking} from "@/features/auth/require";
import {therapistDiscountPercent} from "@/features/rooms/pricing";
import {therapistAvailability, therapistMonthOverview} from "@/features/rooms/availability";
import {AvailabilityCalendar} from "@/features/rooms/components/availability/calendar";
import {RoomsNav} from "@/features/rooms/components/rooms-nav";
import {parseAvailabilityQuery} from "@/features/rooms/query";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {WorkspacePage} from "@/shared/ui/workspace-page";

type RoomsPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{
    view?: string | string[];
    date?: string | string[];
    room?: string | string[];
    rooms?: string | string[];
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
  const monthOverview =
    query.view === "month"
      ? await therapistMonthOverview({
          actor: user,
          date: query.date,
          roomIds: query.roomIds,
        })
      : undefined;
  const availability =
    query.view === "month"
      ? undefined
      : await therapistAvailability({
          actor: user,
          view: query.view,
          date: query.date,
          roomIds: query.roomIds,
        });

  return (
    <SiteShell locale={locale} footerCta={null}>
      <WorkspacePage
        eyebrow={t("eyebrow")}
        nav={<RoomsNav current="calendar" />}
        title={t("title")}
        intro={t("intro")}
      >
        <div className="mt-6">
          <AvailabilityCalendar
            locale={locale}
            query={query}
            availability={availability}
            monthOverview={monthOverview}
            discountPercent={therapistDiscountPercent(user)}
          />
        </div>
      </WorkspacePage>
    </SiteShell>
  );
}

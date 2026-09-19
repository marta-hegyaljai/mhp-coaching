import {getTranslations, setRequestLocale} from "next-intl/server";

import {requireRoomBooking} from "@/features/auth/require";
import {AvailabilityRequestForm} from "@/features/rooms/components/request-form";
import {RoomsWorkspace} from "@/features/rooms/components/rooms-workspace";
import {listRooms} from "@/features/rooms/inventory";
import {parseRequestDraftQuery} from "@/features/rooms/request-query";
import {getBookingSettings} from "@/features/rooms/settings";
import {listingTimes} from "@/features/rooms/timezone";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import type {AppLocale} from "@/i18n/routing";
import {BackLink} from "@/shared/ui/back-link";
import {WorkspacePage} from "@/shared/ui/workspace-page";

type NewRequestPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{
    room?: string | string[];
    date?: string | string[];
    start?: string | string[];
    end?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: NewRequestPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Rooms"});
  return buildPageMetadata({
    locale,
    title: t("requestTitle"),
    description: t("requestIntro"),
    hrefForLocale: () => "/rooms/requests/new",
    robots: {index: false, follow: false},
  });
}

export default async function NewRoomRequestPage({params, searchParams}: NewRequestPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  await requireRoomBooking(locale, localizedPath(locale, "/rooms/requests/new"));
  const t = await getTranslations("Rooms");
  const draft = parseRequestDraftQuery(await searchParams);
  const [rooms, settings] = await Promise.all([listRooms(), getBookingSettings()]);
  const defaultEnd =
    draft.end ??
    defaultEndFromStart(draft.start, settings.minimumBookingMinutes, settings.bookingIntervalMinutes);

  return (
    <RoomsWorkspace locale={locale} current="requests">
      <WorkspacePage
        back={<BackLink href="/rooms/requests">{t("backToRequests")}</BackLink>}
        title={t("requestTitle")}
        intro={t("requestIntro")}
      >
        <div className="mt-8 max-w-xl">
          <AvailabilityRequestForm
            locale={locale}
            rooms={rooms.map((room) => ({id: room.id, name: room.name, active: room.active}))}
            times={listingTimes(settings.bookingIntervalMinutes)}
            defaults={{
              roomId: draft.roomId,
              date: draft.date,
              start: draft.start,
              end: defaultEnd,
            }}
          />
        </div>
      </WorkspacePage>
    </RoomsWorkspace>
  );
}

function defaultEndFromStart(
  start: string | undefined,
  minimumMinutes: number,
  intervalMinutes: number,
): string | undefined {
  if (!start) {
    return undefined;
  }
  const [hour, minute] = start.split(":").map(Number);
  const startMinute = hour * 60 + minute;
  const endMinute = startMinute + Math.max(minimumMinutes, intervalMinutes);
  if (endMinute > 1440) {
    return undefined;
  }
  const hours = Math.floor(endMinute / 60);
  const minutes = endMinute % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

import {getTranslations, setRequestLocale} from "next-intl/server";

import {requireRoomBooking} from "@/features/auth/require";
import {parseBookQuery} from "@/features/rooms/book-query";
import {requestHref} from "@/features/rooms/request-query";
import {RoomBookForm} from "@/features/rooms/components/book-form";
import {RoomsWorkspace} from "@/features/rooms/components/rooms-workspace";
import {RoomError} from "@/features/rooms/errors";
import {
  previewReservationChoices,
  type ReservationPreview,
} from "@/features/rooms/reservations";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {BackLink} from "@/shared/ui/back-link";
import {buttonStyles} from "@/shared/ui/button";
import {Panel} from "@/shared/ui/panel";
import {WorkspacePage} from "@/shared/ui/workspace-page";
import {formatWeekdayDate} from "@/shared/format/calendar-date";

type BookPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{
    room?: string | string[];
    rooms?: string | string[];
    date?: string | string[];
    start?: string | string[];
    end?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: BookPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Rooms"});

  return buildPageMetadata({
    locale,
    title: t("bookTitle"),
    description: t("bookIntro"),
    hrefForLocale: () => "/rooms/book",
    robots: {index: false, follow: false},
  });
}

export default async function RoomBookPage({params, searchParams}: BookPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const user = await requireRoomBooking(locale, localizedPath(locale, "/rooms/book"));
  const t = await getTranslations("Rooms");
  const errors = await getTranslations("Rooms.errors");
  const query = parseBookQuery(await searchParams);

  let previews: ReservationPreview[] = [];
  let error: string | null = null;
  if (!query.roomId || !query.date) {
    error = t("noValidEnds");
  } else {
    try {
      previews = await previewReservationChoices({
        actor: user,
        roomIds: [...new Set([query.roomId, ...query.roomIds])],
        date: query.date,
        start: query.start,
        end: query.end,
      });
      if (previews.length === 0) {
        throw new RoomError("slotUnavailable");
      }
    } catch (caught) {
      error = caught instanceof RoomError ? errors(caught.code) : errors("saveFailed");
    }
  }

  return (
    <RoomsWorkspace locale={locale} current="calendar">
      <WorkspacePage
        eyebrow={t("bookEyebrow")}
        back={<BackLink href="/rooms">{t("backToRooms")}</BackLink>}
        title={t("bookTitle")}
        intro={t("bookIntro")}
      >

        <div className="mt-8 max-w-xl space-y-6">
          {previews.length > 0 ? (
            <RoomBookForm
              locale={locale}
              previews={previews}
              dateLabel={formatWeekdayDate(previews[0]!.date, locale)}
            />
          ) : (
            <Panel>
              <p className="text-sm leading-7 text-ink-muted">{error}</p>
              <p className="mt-4 text-sm leading-7 text-ink-muted">{t("requestDoesNotReserve")}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={requestHref({
                    roomId: query.roomId,
                    date: query.date,
                    start: query.start,
                    end: query.end,
                  })}
                  className={buttonStyles()}
                >
                  {t("requestThisSlot")}
                </Link>
                <Link href="/rooms" className={buttonStyles({variant: "secondary"})}>
                  {t("viewCalendar")}
                </Link>
              </div>
            </Panel>
          )}
        </div>
      </WorkspacePage>
    </RoomsWorkspace>
  );
}

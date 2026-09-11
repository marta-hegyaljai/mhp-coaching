import {getTranslations, setRequestLocale} from "next-intl/server";

import {requireRoomBooking} from "@/features/auth/require";
import {parseBookQuery} from "@/features/rooms/book-query";
import {requestHref} from "@/features/rooms/request-query";
import {RoomBookForm} from "@/features/rooms/components/book-form";
import {RoomsNav} from "@/features/rooms/components/rooms-nav";
import {RoomError} from "@/features/rooms/errors";
import {
  previewReservationChoices,
  type ReservationPreview,
} from "@/features/rooms/reservations";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Panel} from "@/shared/ui/panel";
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
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("bookEyebrow")}</Eyebrow>
        <h1 className="mt-3 font-serif text-heading">{t("bookTitle")}</h1>
        <p className="mt-4 text-sm">
          <Link href="/rooms" className="underline-offset-4 hover:underline">
            {t("backToRooms")}
          </Link>
        </p>
        <RoomsNav current="calendar" />
        <p className="mt-8 max-w-2xl text-sm leading-7 text-ink-muted">{t("bookIntro")}</p>

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
      </Section>
    </SiteShell>
  );
}

import {getTranslations, setRequestLocale} from "next-intl/server";

import {requireRoomBooking} from "@/features/auth/require";
import {parseBookQuery} from "@/features/rooms/book-query";
import {RoomBookForm} from "@/features/rooms/components/book-form";
import {RoomHeader} from "@/features/rooms/components/booking/room-header";
import {RoomsNav} from "@/features/rooms/components/rooms-nav";
import {RoomError} from "@/features/rooms/errors";
import {previewReservation} from "@/features/rooms/reservations";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
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

  let preview = null;
  let error: string | null = null;
  if (!query.roomId || !query.date) {
    error = t("noValidEnds");
  } else {
    try {
      preview = await previewReservation({
        actor: user,
        roomId: query.roomId,
        date: query.date,
        start: query.start,
        end: query.end,
      });
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
          {preview ? (
            <>
              <RoomHeader
                label={t("bookRoom")}
                roomName={preview.room.name}
                rateLabel={`${formatChf(minorUnitsToFrancs(preview.room.hourlyRateMinor), locale)}${t("perHour")}`}
                dateLabel={formatWeekdayDate(preview.date, locale)}
              />
              <RoomBookForm locale={locale} preview={preview} />
            </>
          ) : (
            <Panel>
              <p className="text-sm leading-7 text-ink-muted">{error}</p>
              <Link href="/rooms" className={`${buttonStyles()} mt-6`}>
                {t("viewCalendar")}
              </Link>
            </Panel>
          )}
        </div>
      </Section>
    </SiteShell>
  );
}

import {getTranslations, setRequestLocale} from "next-intl/server";

import {AuthNotice} from "@/features/auth/components/auth-field";
import {requireRoomBooking} from "@/features/auth/require";
import {OwnBookingCancelledFilter} from "@/features/rooms/components/own-bookings/cancelled-filter";
import {presentOwnBooking} from "@/features/rooms/components/own-bookings/item";
import {OwnBookingLists} from "@/features/rooms/components/own-bookings/lists";
import {RoomsNav} from "@/features/rooms/components/rooms-nav";
import {listMyRoomBookings, visibleOwnBookings} from "@/features/rooms/my-bookings";
import {parseOwnBookingQuery} from "@/features/rooms/own-booking-query";
import {todayInZurich} from "@/features/rooms/timezone";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Panel} from "@/shared/ui/panel";

type BookingsPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{
    reserved?: string | string[];
    cancelled?: string | string[];
    status?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: BookingsPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Rooms"});

  return buildPageMetadata({
    locale,
    title: t("bookingsTitle"),
    description: t("bookingsIntro"),
    hrefForLocale: () => "/rooms/bookings",
    robots: {index: false, follow: false},
  });
}

export default async function RoomBookingsPage({params, searchParams}: BookingsPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const user = await requireRoomBooking(locale, localizedPath(locale, "/rooms/bookings"));
  const t = await getTranslations("Rooms");
  const query = parseOwnBookingQuery(await searchParams);
  const stored = await listMyRoomBookings(user);
  const lists = visibleOwnBookings(stored, query.showCancelled);
  const today = todayInZurich();
  const copy = {
    duration: (minutes: number) => t("bookDuration", {minutes}),
    status: (key: "statusConfirmed" | "statusCancelled") => t(key),
    billing: (key: "billingUsage" | "billingFree" | "billingLate" | "billingWaived") => t(key),
  };
  const upcoming = lists.upcoming.map((booking) => presentOwnBooking(booking, locale, today, copy));
  const history = lists.history.map((booking) => presentOwnBooking(booking, locale, today, copy));
  const notice =
    query.notice === "reserved"
      ? t("reserved")
      : query.notice === "cancelled"
        ? t("cancelled")
        : null;
  const hasBookings = stored.upcoming.length > 0 || stored.history.length > 0;

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="mt-3 font-serif text-heading">{t("bookingsTitle")}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-muted">{t("bookingsIntro")}</p>
        <RoomsNav current="bookings" />

        {notice ? (
          <div className="mt-8 max-w-xl">
            <AuthNotice>{notice}</AuthNotice>
          </div>
        ) : null}

        {hasBookings ? (
          <OwnBookingLists
            upcoming={upcoming}
            history={history}
            upcomingTitle={t("upcomingTitle")}
            historyTitle={t("historyTitle")}
            upcomingEmpty={t("upcomingEmpty")}
            historyEmpty={t("historyEmpty")}
            openLabel={t("openBooking")}
            layoutLabel={t("layoutLabel")}
            tableLabel={t("layoutTable")}
            cardsLabel={t("layoutCards")}
            tableLabels={{
              when: t("bookingWhen"),
              room: t("bookingRoom"),
              status: t("bookingStatus"),
              billing: t("bookingBilling"),
              amount: t("bookingAmount"),
              open: t("openBooking"),
              today: t("today"),
            }}
            toolbar={
              <OwnBookingCancelledFilter
                action={localizedPath(locale, "/rooms/bookings")}
                checked={query.showCancelled}
                label={t("showCancelled")}
                applyLabel={t("showCancelled")}
                reserved={query.notice === "reserved"}
                cancelledNotice={query.notice === "cancelled"}
              />
            }
          />
        ) : (
          <Panel className="mt-10 max-w-xl">
            <p className="text-sm leading-7 text-ink-muted">{t("bookingsEmpty")}</p>
            <Link href="/rooms" className={`${buttonStyles()} mt-6`}>
              {t("viewCalendar")}
            </Link>
          </Panel>
        )}
      </Section>
    </SiteShell>
  );
}

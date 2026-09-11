import {getTranslations, setRequestLocale} from "next-intl/server";

import {AuthNotice} from "@/features/auth/components/auth-field";
import {requireRoomBooking} from "@/features/auth/require";
import {RoomBookingCard} from "@/features/rooms/components/booking-card";
import {RoomsNav} from "@/features/rooms/components/rooms-nav";
import {listMyRoomBookings} from "@/features/rooms/my-bookings";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import type {RoomBooking} from "@/db/schema";
import {buttonStyles} from "@/shared/ui/button";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Panel} from "@/shared/ui/panel";

type BookingsPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{reserved?: string | string[]; cancelled?: string | string[]}>;
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
  const {upcoming, history} = await listMyRoomBookings(user);
  const query = await searchParams;
  const notice = firstString(query.reserved) === "1"
    ? t("reserved")
    : firstString(query.cancelled) === "1"
      ? t("cancelled")
      : null;
  const hasBookings = upcoming.length > 0 || history.length > 0;

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
          <div className="mt-10 space-y-12">
            <BookingGroup
              title={t("upcomingTitle")}
              empty={t("upcomingEmpty")}
              bookings={upcoming}
              locale={locale}
            />
            <BookingGroup
              title={t("historyTitle")}
              empty={t("historyEmpty")}
              bookings={history}
              locale={locale}
            />
          </div>
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

function BookingGroup({
  title,
  empty,
  bookings,
  locale,
}: {
  title: string;
  empty: string;
  bookings: RoomBooking[];
  locale: AppLocale;
}) {
  return (
    <section>
      <h2 className="font-serif text-subheading">{title}</h2>
      {bookings.length === 0 ? (
        <p className="mt-4 text-sm leading-7 text-ink-muted">{empty}</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <RoomBookingCard booking={booking} locale={locale} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";

import {requireRoomBooking} from "@/features/auth/require";
import {isFreeCancellation} from "@/features/rooms/billing";
import {BookingFacts} from "@/features/rooms/components/booking/booking-facts";
import {CancelBookingDialog} from "@/features/rooms/components/cancel-booking-dialog";
import {RoomsNav} from "@/features/rooms/components/rooms-nav";
import {RoomError} from "@/features/rooms/errors";
import {bookingWhen} from "@/features/rooms/format";
import {ownerCanMutateBooking} from "@/features/rooms/lifecycle";
import {getMyRoomBooking} from "@/features/rooms/my-bookings";
import {getBookingSettings} from "@/features/rooms/settings";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {BackLink} from "@/shared/ui/back-link";
import {Panel} from "@/shared/ui/panel";
import {WorkspacePage} from "@/shared/ui/workspace-page";
import {SectionLabel} from "@/shared/ui/section-label";

type CancelPageProps = {
  params: Promise<{locale: AppLocale; id: string}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: CancelPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Rooms"});
  return buildPageMetadata({
    locale,
    title: t("cancelTitle"),
    description: t("cancelIntro"),
    hrefForLocale: () => "/rooms/bookings",
    robots: {index: false, follow: false},
  });
}

export default async function CancelRoomBookingPage({params}: CancelPageProps) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  const user = await requireRoomBooking(
    locale,
    localizedPath(locale, {pathname: "/rooms/bookings/[id]/cancel", params: {id}}),
  );
  const t = await getTranslations("Rooms");
  let booking;
  try {
    booking = await getMyRoomBooking(user, id);
  } catch (error) {
    if (error instanceof RoomError && error.code === "notFound") {
      notFound();
    }
    throw error;
  }
  if (!ownerCanMutateBooking(booking)) {
    notFound();
  }

  const settings = await getBookingSettings();
  const late = !isFreeCancellation(booking.startsAt, new Date(), settings.cancellationNoticeHours);
  const amount = formatChf(minorUnitsToFrancs(booking.amountMinor), locale);

  return (
    <SiteShell
      locale={locale}
      footerCta={null}
      hreflangs={{
        fr: {pathname: "/rooms/bookings/[id]/cancel", params: {id}},
        de: {pathname: "/rooms/bookings/[id]/cancel", params: {id}},
        en: {pathname: "/rooms/bookings/[id]/cancel", params: {id}},
      }}
    >
      <WorkspacePage
        eyebrow={t("eyebrow")}
        nav={<RoomsNav current="bookings" />}
        back={
          <BackLink href={{pathname: "/rooms/bookings/[id]", params: {id}}}>
            {t("backToBooking")}
          </BackLink>
        }
        title={t("cancelTitle")}
        intro={t("cancelIntro")}
      >

        <div className="mt-8 max-w-xl space-y-6">
          <Panel>
            <SectionLabel>{t("currentBooking")}</SectionLabel>
            <div className="mt-3">
              <BookingFacts
                roomName={booking.roomName}
                when={bookingWhen(booking.startsAt, booking.endsAt, locale)}
                durationLabel={t("bookDuration", {minutes: booking.durationMinutes})}
                headingLevel="h2"
              />
            </div>
          </Panel>

          <CancelBookingDialog
            locale={locale}
            bookingId={booking.id}
            late={late}
            amount={amount}
            triggerLabel={t("cancelBooking")}
            defaultOpen
          />
        </div>
      </WorkspacePage>
    </SiteShell>
  );
}

import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";

import {requireRoomBooking} from "@/features/auth/require";
import {parseBookQuery} from "@/features/rooms/book-query";
import {isFreeCancellation} from "@/features/rooms/billing";
import {BookingFacts} from "@/features/rooms/components/booking/booking-facts";
import {SlotNavigator} from "@/features/rooms/components/booking/slot-navigator";
import {ChangeBookingForm} from "@/features/rooms/components/change-form";
import {RoomsNav} from "@/features/rooms/components/rooms-nav";
import {RoomError} from "@/features/rooms/errors";
import {bookingWhen} from "@/features/rooms/format";
import {ownerCanMutateBooking} from "@/features/rooms/lifecycle";
import {listRooms} from "@/features/rooms/inventory";
import {getMyRoomBooking} from "@/features/rooms/my-bookings";
import {previewReservation} from "@/features/rooms/reservations";
import {getBookingSettings} from "@/features/rooms/settings";
import {utcToZurich} from "@/features/rooms/timezone";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Panel} from "@/shared/ui/panel";
import {SectionLabel} from "@/shared/ui/section-label";

type ChangePageProps = {
  params: Promise<{locale: AppLocale; id: string}>;
  searchParams: Promise<{
    room?: string | string[];
    date?: string | string[];
    start?: string | string[];
    end?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: ChangePageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Rooms"});
  return buildPageMetadata({
    locale,
    title: t("changeTitle"),
    description: t("changeIntro"),
    hrefForLocale: () => "/rooms/bookings",
    robots: {index: false, follow: false},
  });
}

export default async function ChangeRoomBookingPage({params, searchParams}: ChangePageProps) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  const user = await requireRoomBooking(
    locale,
    localizedPath(locale, {pathname: "/rooms/bookings/[id]/change", params: {id}}),
  );
  const t = await getTranslations("Rooms");
  const errors = await getTranslations("Rooms.errors");
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

  const rooms = (await listRooms()).filter((room) => room.active);
  const query = parseBookQuery(await searchParams);
  const current = utcToZurich(booking.startsAt);
  const roomId = query.roomId ?? booking.roomId;
  const date = query.date ?? current.date;
  const settings = await getBookingSettings();
  const late = !isFreeCancellation(booking.startsAt, new Date(), settings.cancellationNoticeHours);
  const lateAmount = formatChf(minorUnitsToFrancs(booking.amountMinor), locale);

  let preview = null;
  let error: string | null = null;
  try {
    preview = await previewReservation({
      actor: user,
      roomId,
      date,
      start: query.start ?? current.time,
      end: query.end ?? utcToZurich(booking.endsAt).time,
      exceptBookingId: booking.id,
    });
  } catch (caught) {
    error = caught instanceof RoomError ? errors(caught.code) : errors("saveFailed");
  }

  return (
    <SiteShell
      locale={locale}
      footerCta={null}
      hreflangs={{
        fr: {pathname: "/rooms/bookings/[id]/change", params: {id}},
        de: {pathname: "/rooms/bookings/[id]/change", params: {id}},
        en: {pathname: "/rooms/bookings/[id]/change", params: {id}},
      }}
    >
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="mt-3 font-serif text-heading">{t("changeTitle")}</h1>
        <p className="mt-4 text-sm">
          <Link
            href={{pathname: "/rooms/bookings/[id]", params: {id}}}
            className="underline-offset-4 hover:underline"
          >
            {t("backToBookings")}
          </Link>
        </p>
        <RoomsNav current="bookings" />
        <p className="mt-8 max-w-2xl text-sm leading-7 text-ink-muted">{t("changeIntro")}</p>

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

          {/* Outside the confirm form so a fully booked day is still navigable. */}
          <SlotNavigator
            action={localizedPath(locale, {
              pathname: "/rooms/bookings/[id]/change",
              params: {id},
            })}
            label={t("newSlot")}
            rooms={rooms}
            roomId={roomId}
            date={date}
          />

          {preview ? (
            <ChangeBookingForm
              locale={locale}
              bookingId={booking.id}
              preview={preview}
              lateChargeAmount={late ? lateAmount : undefined}
            />
          ) : (
            <Panel>
              <p className="text-sm leading-7 text-ink-muted">{error}</p>
            </Panel>
          )}
        </div>
      </Section>
    </SiteShell>
  );
}

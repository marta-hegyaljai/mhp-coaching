import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";

import {AuthNotice} from "@/features/auth/components/auth-field";
import {requireRoomBooking} from "@/features/auth/require";
import {chargeableAmountMinor} from "@/features/rooms/billing";
import {bookingLabelKeys} from "@/features/rooms/booking-labels";
import {AmountSummary} from "@/features/rooms/components/booking/amount-summary";
import {BookingFacts} from "@/features/rooms/components/booking/booking-facts";
import {RoomsNav} from "@/features/rooms/components/rooms-nav";
import {RoomError} from "@/features/rooms/errors";
import {bookingWhen} from "@/features/rooms/format";
import {ownerCanMutateBooking} from "@/features/rooms/lifecycle";
import {assertOwnBookingPrivacy, getMyRoomBooking} from "@/features/rooms/my-bookings";
import {utcToZurich} from "@/features/rooms/timezone";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {availabilityHref} from "@/features/rooms/query";
import {buttonStyles} from "@/shared/ui/button";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Panel, PanelDivider} from "@/shared/ui/panel";
import {StatusLabel} from "@/shared/ui/status-label";

type BookingDetailPageProps = {
  params: Promise<{locale: AppLocale; id: string}>;
  searchParams: Promise<{moved?: string | string[]; replaced?: string | string[]}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: BookingDetailPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Rooms"});

  return buildPageMetadata({
    locale,
    title: t("bookingDetailTitle"),
    description: t("bookingsIntro"),
    hrefForLocale: () => "/rooms/bookings",
    robots: {index: false, follow: false},
  });
}

export default async function RoomBookingDetailPage({params, searchParams}: BookingDetailPageProps) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  const user = await requireRoomBooking(
    locale,
    localizedPath(locale, {pathname: "/rooms/bookings/[id]", params: {id}}),
  );
  const t = await getTranslations("Rooms");
  const notices = await searchParams;

  let booking;
  try {
    booking = await getMyRoomBooking(user, id);
  } catch (error) {
    if (error instanceof RoomError && error.code === "notFound") {
      notFound();
    }
    throw error;
  }
  assertOwnBookingPrivacy(booking);

  const keys = bookingLabelKeys(booking);
  const when = bookingWhen(booking.startsAt, booking.endsAt, locale);
  const canMutate = ownerCanMutateBooking(booking);
  const notice = firstString(notices.moved) === "1"
    ? t("changed")
    : firstString(notices.replaced) === "1"
      ? t("replaced")
      : null;

  return (
    <SiteShell
      locale={locale}
      footerCta={null}
      hreflangs={{
        fr: {pathname: "/rooms/bookings/[id]", params: {id}},
        de: {pathname: "/rooms/bookings/[id]", params: {id}},
        en: {pathname: "/rooms/bookings/[id]", params: {id}},
      }}
    >
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="mt-3 font-serif text-heading">{t("bookingDetailTitle")}</h1>
        <p className="mt-4 text-sm">
          <Link href="/rooms/bookings" className="underline-offset-4 hover:underline">
            {t("backToBookings")}
          </Link>
        </p>
        <RoomsNav current="bookings" />

        {notice ? (
          <div className="mt-8 max-w-xl">
            <AuthNotice>{notice}</AuthNotice>
          </div>
        ) : null}

        <div className="mt-8 max-w-xl space-y-6">
          <Panel as="article">
            <StatusLabel tone={booking.status === "CANCELLED" ? "muted" : "strong"}>
              {t(keys.status)}
            </StatusLabel>
            <div className="mt-3">
              <BookingFacts
                roomName={booking.roomName}
                when={when}
                durationLabel={t("bookDuration", {minutes: booking.durationMinutes})}
              />
            </div>

            <PanelDivider className="mt-6" />
            <div className="mt-6">
              <AmountSummary
                locale={locale}
                durationMinutes={booking.durationMinutes}
                rateMinor={booking.effectiveHourlyRateMinor}
                amountMinor={booking.amountMinor}
                chargeableMinor={chargeableAmountMinor(booking)}
                discountPercent={booking.discountPercent}
                outcomeNote={t(keys.billing)}
                showBillingNote={keys.billing === "billingUsage"}
              />
            </div>

            {booking.successorBookingId ? (
              <p className="mt-6 text-sm">
                <Link
                  href={{
                    pathname: "/rooms/bookings/[id]",
                    params: {id: booking.successorBookingId},
                  }}
                  className="underline-offset-4 hover:underline"
                >
                  {t("successorLink")}
                </Link>
              </p>
            ) : null}
          </Panel>

          {canMutate ? (
            <div className="flex flex-wrap gap-3">
              <Link
                href={{pathname: "/rooms/bookings/[id]/change", params: {id: booking.id}}}
                className={buttonStyles()}
              >
                {t("changeBooking")}
              </Link>
              <Link
                href={{pathname: "/rooms/bookings/[id]/cancel", params: {id: booking.id}}}
                className={buttonStyles({variant: "secondary"})}
              >
                {t("cancelBooking")}
              </Link>
            </div>
          ) : null}

          <p className="text-sm">
            <Link
              href={availabilityHref({
                view: "day",
                date: utcToZurich(booking.startsAt).date,
                roomId: booking.roomId,
              })}
              className="underline-offset-4 hover:underline"
            >
              {t("viewCalendar")}
            </Link>
          </p>
        </div>
      </Section>
    </SiteShell>
  );
}

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

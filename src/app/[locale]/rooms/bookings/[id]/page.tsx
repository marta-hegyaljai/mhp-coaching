import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";

import {AuthNotice} from "@/features/auth/components/auth-field";
import {requireRoomBooking} from "@/features/auth/require";
import {chargeableAmountMinor, isFreeCancellation} from "@/features/rooms/billing";
import {bookingLabelKeys} from "@/features/rooms/booking-labels";
import {AmountSummary} from "@/features/rooms/components/booking/amount-summary";
import {BookingFacts} from "@/features/rooms/components/booking/booking-facts";
import {CancelBookingDialog} from "@/features/rooms/components/cancel-booking-dialog";
import {PrivateNoteForm} from "@/features/rooms/components/private-note-form";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {getBookingSettings} from "@/features/rooms/settings";
import {RoomsWorkspace} from "@/features/rooms/components/rooms-workspace";
import {RoomError} from "@/features/rooms/errors";
import {bookingWhen} from "@/features/rooms/format";
import {ownerCanMutateBooking} from "@/features/rooms/lifecycle";
import {assertOwnBookingPrivacy, getMyRoomBooking} from "@/features/rooms/my-bookings";
import {getOwnPrivateNote} from "@/features/rooms/private-notes";
import {utcToZurich} from "@/features/rooms/timezone";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {availabilityHref} from "@/features/rooms/query";
import {BackLink} from "@/shared/ui/back-link";
import {buttonStyles} from "@/shared/ui/button";
import {Panel, PanelDivider} from "@/shared/ui/panel";
import {StatusLabel} from "@/shared/ui/status-label";
import {WorkspacePage} from "@/shared/ui/workspace-page";

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

  let noteText = "";
  let noteError: string | null = null;
  try {
    noteText = (await getOwnPrivateNote(user, booking.id))?.text ?? "";
  } catch (error) {
    if (
      error instanceof RoomError &&
      (error.code === "noteKeyMissing" ||
        error.code === "noteKeyInvalid" ||
        error.code === "noteDecryptFailed")
    ) {
      const errors = await getTranslations("Rooms.errors");
      noteError = errors(error.code);
    } else {
      throw error;
    }
  }

  const keys = bookingLabelKeys(booking);
  const when = bookingWhen(booking.startsAt, booking.endsAt, locale);
  const canMutate = ownerCanMutateBooking(booking);
  const settings = canMutate ? await getBookingSettings() : null;
  const late = settings
    ? !isFreeCancellation(booking.startsAt, new Date(), settings.cancellationNoticeHours)
    : false;
  const cancelAmount = formatChf(minorUnitsToFrancs(booking.amountMinor), locale);
  const notice = firstString(notices.moved) === "1"
    ? t("changed")
    : firstString(notices.replaced) === "1"
      ? t("replaced")
      : null;

  return (
    <RoomsWorkspace
      locale={locale}
      current="bookings"
      hreflangs={{
        fr: {pathname: "/rooms/bookings/[id]", params: {id}},
        de: {pathname: "/rooms/bookings/[id]", params: {id}},
        en: {pathname: "/rooms/bookings/[id]", params: {id}},
      }}
    >
      <WorkspacePage
        back={<BackLink href="/rooms/bookings">{t("backToBookings")}</BackLink>}
        title={t("bookingDetailTitle")}
      >

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

          {noteError ? (
            <Panel>
              <p className="text-sm leading-7 text-ink">{noteError}</p>
            </Panel>
          ) : (
            <PrivateNoteForm locale={locale} bookingId={booking.id} initialText={noteText} />
          )}

          {canMutate ? (
            <div className="flex flex-wrap gap-3">
              <Link
                href={{pathname: "/rooms/bookings/[id]/change", params: {id: booking.id}}}
                className={buttonStyles()}
              >
                {t("changeBooking")}
              </Link>
              <CancelBookingDialog
                locale={locale}
                bookingId={booking.id}
                late={late}
                amount={cancelAmount}
                triggerLabel={t("cancelBooking")}
              />
            </div>
          ) : null}

          <p className="text-sm">
            <Link
              href={availabilityHref({
                view: "day",
                date: utcToZurich(booking.startsAt).date,
                roomIds: [booking.roomId],
              })}
              className="underline-offset-4 hover:underline"
            >
              {t("viewCalendar")}
            </Link>
          </p>
        </div>
      </WorkspacePage>
    </RoomsWorkspace>
  );
}

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

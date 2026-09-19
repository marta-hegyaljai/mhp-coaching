import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";

import {AdminWorkspace} from "@/features/admin/components/admin-workspace";
import {AuthNotice} from "@/features/auth/components/auth-field";
import {findUserById} from "@/features/auth/repository";
import {requireAdmin} from "@/features/auth/require";
import {parseBookQuery} from "@/features/rooms/book-query";
import {
  adminBookingDetailHref,
  parseAdminBookingAction,
} from "@/features/rooms/admin-booking-action";
import {chargeableAmountMinor, isFreeCancellation} from "@/features/rooms/billing";
import {bookingLabelKeys} from "@/features/rooms/booking-labels";
import {AdminCancelBookingForm} from "@/features/rooms/components/admin/bookings/cancel-form";
import {AdminMoveBookingForm} from "@/features/rooms/components/admin/bookings/move-form";
import {AdminWaiveBookingForm} from "@/features/rooms/components/admin/bookings/waive-form";
import {AmountSummary} from "@/features/rooms/components/booking/amount-summary";
import {BookingFacts} from "@/features/rooms/components/booking/booking-facts";
import {SlotNavigator} from "@/features/rooms/components/booking/slot-navigator";
import {BookingHistory} from "@/features/rooms/components/admin/booking-history";
import {RoomError} from "@/features/rooms/errors";
import {bookingWhen} from "@/features/rooms/format";
import {listRooms} from "@/features/rooms/inventory";
import {
  adminCanCancelBooking,
  adminCanWaiveBooking,
  getAdminRoomBooking,
  ownerCanMutateBooking,
} from "@/features/rooms/lifecycle";
import {listBookingEvents} from "@/features/rooms/repository";
import {previewBookableSlot} from "@/features/rooms/reservations";
import {getBookingSettings} from "@/features/rooms/settings";
import {utcToZurich} from "@/features/rooms/timezone";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {BackLink} from "@/shared/ui/back-link";
import {buttonStyles} from "@/shared/ui/button";
import {Panel, PanelDivider} from "@/shared/ui/panel";
import {SectionLabel} from "@/shared/ui/section-label";
import {StatusLabel} from "@/shared/ui/status-label";
import {WorkspacePage} from "@/shared/ui/workspace-page";

type AdminBookingDetailProps = {
  params: Promise<{locale: AppLocale; id: string}>;
  searchParams: Promise<{
    action?: string | string[];
    room?: string | string[];
    date?: string | string[];
    start?: string | string[];
    end?: string | string[];
    created?: string | string[];
    moved?: string | string[];
    cancelled?: string | string[];
    waived?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdminBookingDetailProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  return buildPageMetadata({
    locale,
    title: t("adminBookingsTitle"),
    description: t("adminBookingsIntro"),
    hrefForLocale: () => "/admin/bookings",
    robots: {index: false, follow: false},
  });
}

export default async function AdminBookingDetailPage({
  params,
  searchParams,
}: AdminBookingDetailProps) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  const actor = await requireAdmin(
    locale,
    localizedPath(locale, {pathname: "/admin/bookings/[id]", params: {id}}),
  );
  const t = await getTranslations("Admin");
  const roomsCopy = await getTranslations("Rooms");
  const errors = await getTranslations("Rooms.errors");
  const raw = await searchParams;

  let booking;
  try {
    booking = await getAdminRoomBooking(actor, id);
  } catch (error) {
    if (error instanceof RoomError && error.code === "notFound") {
      notFound();
    }
    throw error;
  }

  const owner = await findUserById(booking.userId);
  const events = await listBookingEvents(booking.id);
  const rooms = (await listRooms()).filter((room) => room.active);
  const settings = await getBookingSettings();
  const now = new Date();
  const keys = bookingLabelKeys(booking);
  const canMove = ownerCanMutateBooking(booking, now);
  const canCancel = adminCanCancelBooking(booking);
  const canWaive = adminCanWaiveBooking(booking);
  const late = !isFreeCancellation(booking.startsAt, now, settings.cancellationNoticeHours);
  const amount = formatChf(minorUnitsToFrancs(booking.amountMinor), locale);
  const start = utcToZurich(booking.startsAt);
  const end = utcToZurich(booking.endsAt);
  const requested = parseAdminBookingAction(raw.action);
  // A decision that is no longer permitted falls back to the overview.
  const decision =
    (requested === "move" && canMove) ||
    (requested === "cancel" && canCancel) ||
    (requested === "waive" && canWaive)
      ? requested
      : null;
  const notice = pickNotice(raw, {
    created: t("adminCreated"),
    moved: t("adminMoved"),
    cancelled: roomsCopy("cancelled"),
    waived: t("waived"),
  });

  const query = parseBookQuery(raw);
  const moveRoomId = query.roomId ?? booking.roomId;
  const moveDate = query.date ?? start.date;
  let preview = null;
  let previewError: string | null = null;
  if (decision === "move") {
    try {
      preview = await previewBookableSlot({
        roomId: moveRoomId,
        date: moveDate,
        start: query.start ?? start.time,
        end: query.end ?? end.time,
        exceptBookingId: booking.id,
      });
    } catch (error) {
      previewError = error instanceof RoomError ? errors(error.code) : errors("saveFailed");
    }
  }

  return (
    <AdminWorkspace locale={locale} current="bookings">
      <WorkspacePage
        back={<BackLink href="/admin/bookings">{t("backToAdminBookings")}</BackLink>}
        title={t("detailBookingTitle")}
      >

        {notice ? (
          <div className="mt-8 max-w-xl">
            <AuthNotice>{notice}</AuthNotice>
          </div>
        ) : null}

        <div className="mt-8 max-w-xl space-y-6">
          <Panel as="article">
            <StatusLabel tone={booking.status === "CANCELLED" ? "stop" : "ok"}>
              {roomsCopy(keys.status)}
            </StatusLabel>
            <div className="mt-3">
              <BookingFacts
                roomName={booking.roomName}
                ownerLabel={
                  owner ? `${owner.firstName} ${owner.lastName} · ${owner.email}` : undefined
                }
                when={bookingWhen(booking.startsAt, booking.endsAt, locale)}
                durationLabel={roomsCopy("bookDuration", {minutes: booking.durationMinutes})}
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
                outcomeNote={roomsCopy(keys.billing)}
              />
            </div>
          </Panel>

          {decision === null ? (
            <Panel>
              <SectionLabel>{t("bookingActions")}</SectionLabel>
              {canMove || canCancel || canWaive ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  {canMove ? (
                    <Link
                      href={adminBookingDetailHref(booking.id, "move")}
                      className={buttonStyles()}
                    >
                      {roomsCopy("changeBooking")}
                    </Link>
                  ) : null}
                  {canCancel ? (
                    <Link
                      href={adminBookingDetailHref(booking.id, "cancel")}
                      className={buttonStyles({variant: "secondary"})}
                    >
                      {roomsCopy("cancelBooking")}
                    </Link>
                  ) : null}
                  {canWaive ? (
                    <Link
                      href={adminBookingDetailHref(booking.id, "waive")}
                      className={buttonStyles({variant: "secondary"})}
                    >
                      {t("waiveCharge")}
                    </Link>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-7 text-ink-muted">{t("noBookingActions")}</p>
              )}
            </Panel>
          ) : (
            <BackLink href={adminBookingDetailHref(booking.id)}>
              {t("backToBooking")}
            </BackLink>
          )}

          {decision === "move" ? (
            <>
              <SlotNavigator
                action={localizedPath(locale, {
                  pathname: "/admin/bookings/[id]",
                  params: {id: booking.id},
                })}
                label={roomsCopy("newSlot")}
                rooms={rooms}
                roomId={moveRoomId}
                date={moveDate}
              >
                {/* Keeps the move step selected when the navigator submits. */}
                <input type="hidden" name="action" value="move" />
              </SlotNavigator>
              {preview ? (
                <AdminMoveBookingForm
                  locale={locale}
                  bookingId={booking.id}
                  preview={preview}
                />
              ) : (
                <Panel>
                  <p className="text-sm leading-7 text-ink-muted">{previewError}</p>
                </Panel>
              )}
            </>
          ) : null}

          {decision === "cancel" ? (
            <AdminCancelBookingForm
              locale={locale}
              bookingId={booking.id}
              late={late}
              amount={amount}
            />
          ) : null}

          {decision === "waive" ? (
            <AdminWaiveBookingForm locale={locale} bookingId={booking.id} amount={amount} />
          ) : null}
        </div>

        <BookingHistory className="mt-12 max-w-xl" events={events} locale={locale} />
      </WorkspacePage>
    </AdminWorkspace>
  );
}

function pickNotice(
  raw: Record<string, string | string[] | undefined>,
  messages: {created: string; moved: string; cancelled: string; waived: string},
): string | null {
  for (const key of ["created", "moved", "cancelled", "waived"] as const) {
    const value = raw[key];
    if ((Array.isArray(value) ? value[0] : value) === "1") {
      return messages[key];
    }
  }
  return null;
}

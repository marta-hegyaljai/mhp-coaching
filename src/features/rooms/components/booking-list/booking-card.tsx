import type {RoomBookingStatus} from "@/db/schema";
import {bookingStatusRailClass} from "@/features/rooms/components/booking-list/status";
import {BookingStatusMark} from "@/features/rooms/components/booking-list/status-mark";
import type {PathnameHref} from "@/i18n/href";
import {Link} from "@/i18n/navigation";
import {Price} from "@/shared/ui/price";

/** Equal-height bordered cards, one column on a phone and two from `lg`. */
export const bookingCardGridClass = "grid gap-3 lg:grid-cols-2";

export type BookingCardProps = {
  href: PathnameHref;
  status: RoomBookingStatus;
  statusLabel: string;
  timeLabel: string;
  dateLabel: string;
  isToday: boolean;
  /** The therapist for staff lists, the room for a therapist's own bookings. */
  title: string;
  subtitle?: string;
  /** The remaining facts of one line, already joined for the locale. */
  detail: string;
  billingLabel: string;
  amountLabel: string;
  chargeable: boolean;
  openLabel: string;
  todayLabel: string;
};

/**
 * The one booking card for every list: status rail and price lead, the time
 * anchors it, and billing closes it on a hairline.
 */
export function BookingCard({
  href,
  status,
  statusLabel,
  timeLabel,
  dateLabel,
  isToday,
  title,
  subtitle,
  detail,
  billingLabel,
  amountLabel,
  chargeable,
  openLabel,
  todayLabel,
}: BookingCardProps) {
  return (
    <Link
      href={href}
      className={`flex h-full flex-col rounded-panel border border-ink border-l-[3px] bg-white p-4 transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${bookingStatusRailClass(status)} ${
        status === "CANCELLED" ? "text-ink-muted" : "text-ink"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <BookingStatusMark status={status} label={statusLabel} />
        <Price size="sm" tone={chargeable ? "strong" : "muted"}>
          {amountLabel}
        </Price>
      </div>
      <p className="mt-3 font-sans text-lg font-semibold leading-tight tabular-nums whitespace-nowrap text-ink">
        {timeLabel}
      </p>
      <p className="mt-1 text-sm leading-6 text-ink">
        {dateLabel}
        {isToday ? (
          <span className="ml-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-gold-deep">
            {todayLabel}
          </span>
        ) : null}
      </p>
      <h3 className="mt-3 font-serif text-xl leading-tight text-ink">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm leading-6 text-ink-muted break-all">{subtitle}</p> : null}
      <p className="mt-3 text-sm leading-6 text-ink">{detail}</p>
      <p className="mt-auto border-t border-line pt-3 text-sm leading-6 text-ink">{billingLabel}</p>
      <span className="sr-only">{openLabel}</span>
    </Link>
  );
}

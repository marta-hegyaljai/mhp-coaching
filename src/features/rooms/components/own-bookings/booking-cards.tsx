import {bookingStatusRailClass} from "@/features/rooms/components/booking-list/status";
import {BookingStatusMark} from "@/features/rooms/components/booking-list/status-mark";
import type {OwnBookingItem} from "@/features/rooms/components/own-bookings/item";
import {Link} from "@/i18n/navigation";
import {Price} from "@/shared/ui/price";

/**
 * Compact full-width rows: time and room lead, no owner line, no tall gallery.
 */
export function OwnBookingCards({
  items,
  openLabel,
  todayLabel,
}: {
  items: OwnBookingItem[];
  openLabel: string;
  todayLabel: string;
}) {
  return (
    <ul className="divide-y divide-line-soft rounded-panel border border-ink">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={{pathname: "/rooms/bookings/[id]", params: {id: item.id}}}
            className={`grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-0.5 border-l-[3px] px-3 py-2.5 transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink sm:grid-cols-[auto_minmax(0,1fr)_auto] ${bookingStatusRailClass(item.status)} ${
              item.status === "CANCELLED" ? "text-ink-muted" : "text-ink"
            }`}
          >
            <p className="font-sans text-sm font-semibold leading-6 tabular-nums whitespace-nowrap text-ink">
              {item.timeLabel}
            </p>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-serif text-lg leading-tight text-ink">{item.roomName}</h3>
                <BookingStatusMark status={item.status} label={item.statusLabel} />
              </div>
              <p className="mt-0.5 text-sm leading-6 text-ink-muted">
                {item.dateLabel}
                {item.isToday ? (
                  <span className="ml-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-gold-deep">
                    {todayLabel}
                  </span>
                ) : null}
                <span> · {item.durationLabel}</span>
              </p>
              <p className="text-sm leading-6 text-ink sm:hidden">{item.billingLabel}</p>
            </div>
            <div className="col-start-2 flex items-end justify-between gap-3 sm:col-start-3 sm:flex-col sm:items-end sm:justify-start">
              <p className="hidden text-sm leading-6 text-ink sm:block">{item.billingLabel}</p>
              <Price size="sm" tone={item.chargeable ? "strong" : "muted"}>
                {item.amountLabel}
              </Price>
            </div>
            <span className="sr-only">{openLabel}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

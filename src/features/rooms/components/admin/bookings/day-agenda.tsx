import {bookingStatusRailClass} from "@/features/rooms/components/admin/bookings/item";
import type {AdminBookingItem} from "@/features/rooms/components/admin/bookings/item";
import {BookingStatusMark} from "@/features/rooms/components/admin/bookings/status-mark";
import {Link} from "@/i18n/navigation";
import {Price} from "@/shared/ui/price";

export function AdminBookingDayAgenda({
  items,
  openLabel,
}: {
  items: AdminBookingItem[];
  openLabel: string;
}) {
  return (
    <ol className="divide-y divide-line-soft rounded-panel border border-ink">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={{pathname: "/admin/bookings/[id]", params: {id: item.id}}}
            className={`grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 border-l-[3px] px-4 py-4 transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] ${bookingStatusRailClass(item.status)} ${
              item.status === "CANCELLED" ? "text-ink-muted" : "text-ink"
            }`}
          >
            <p className="font-sans text-sm font-semibold leading-6 tabular-nums whitespace-nowrap text-ink">
              {item.timeLabel}
            </p>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-serif text-lg leading-tight text-ink">{item.ownerName}</h3>
                <BookingStatusMark item={item} />
              </div>
              <p className="mt-1 text-sm leading-6 text-ink">
                {item.roomName}
                <span className="text-ink-muted"> · {item.durationLabel}</span>
              </p>
              <p className="text-sm leading-6 text-ink-muted">{item.ownerEmail}</p>
              <p className="mt-2 text-sm leading-6 text-ink sm:hidden">{item.billingLabel}</p>
            </div>
            <div className="col-start-2 mt-3 flex items-end justify-between gap-3 sm:col-start-3 sm:mt-0 sm:flex-col sm:items-end">
              <p className="hidden text-sm leading-6 text-ink sm:block">{item.billingLabel}</p>
              <Price size="sm" tone={item.chargeable ? "strong" : "muted"}>
                {item.amountLabel}
              </Price>
            </div>
            <span className="sr-only">{openLabel}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

import {bookingStatusRailClass} from "@/features/rooms/components/admin/bookings/item";
import type {AdminBookingItem} from "@/features/rooms/components/admin/bookings/item";
import {BookingStatusMark} from "@/features/rooms/components/admin/bookings/status-mark";
import {Link} from "@/i18n/navigation";
import {Price} from "@/shared/ui/price";

/**
 * Compact admin card: time and therapist lead, status is a coloured rail, not a fill.
 */
export function AdminBookingCard({
  item,
  openLabel,
}: {
  item: AdminBookingItem;
  openLabel: string;
}) {
  return (
    <Link
      href={{pathname: "/admin/bookings/[id]", params: {id: item.id}}}
      className={`flex h-full flex-col rounded-panel border border-ink border-l-[3px] bg-white p-4 transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${bookingStatusRailClass(item.status)} ${
        item.status === "CANCELLED" ? "text-ink-muted" : "text-ink"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <BookingStatusMark item={item} />
        <Price size="sm" tone={item.chargeable ? "strong" : "muted"}>
          {item.amountLabel}
        </Price>
      </div>
      <p className="mt-3 font-sans text-lg font-semibold leading-tight tabular-nums whitespace-nowrap text-ink">
        {item.timeLabel}
      </p>
      <p className="mt-1 text-sm leading-6 text-ink">{item.dateLabel}</p>
      <h3 className="mt-3 font-serif text-xl leading-tight text-ink">{item.ownerName}</h3>
      <p className="mt-1 text-sm leading-6 text-ink-muted">{item.ownerEmail}</p>
      <p className="mt-3 text-sm leading-6 text-ink">
        {item.roomName}
        <span className="text-ink-muted"> · {item.durationLabel}</span>
      </p>
      <p className="mt-auto border-t border-line pt-3 text-sm leading-6 text-ink">
        {item.billingLabel}
      </p>
      <span className="sr-only">{openLabel}</span>
    </Link>
  );
}

export function AdminBookingCardGrid({
  items,
  openLabel,
}: {
  items: AdminBookingItem[];
  openLabel: string;
}) {
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {items.map((item) => (
        <li key={item.id}>
          <AdminBookingCard item={item} openLabel={openLabel} />
        </li>
      ))}
    </ul>
  );
}

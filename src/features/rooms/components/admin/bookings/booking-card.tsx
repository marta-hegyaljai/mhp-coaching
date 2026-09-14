import type {AdminBookingItem} from "@/features/rooms/components/admin/bookings/item";
import {
  BookingCard,
  bookingCardGridClass,
} from "@/features/rooms/components/booking-list/booking-card";

/** Staff view of the shared card: the therapist leads, the room is a fact. */
export function AdminBookingCardGrid({
  items,
  openLabel,
  todayLabel,
}: {
  items: AdminBookingItem[];
  openLabel: string;
  todayLabel: string;
}) {
  return (
    <ul className={bookingCardGridClass}>
      {items.map((item) => (
        <li key={item.id}>
          <BookingCard
            href={{pathname: "/admin/bookings/[id]", params: {id: item.id}}}
            status={item.status}
            statusLabel={item.statusLabel}
            timeLabel={item.timeLabel}
            dateLabel={item.dateLabel}
            isToday={item.isToday}
            title={item.ownerName}
            subtitle={item.ownerEmail}
            detail={`${item.roomName} · ${item.durationLabel}`}
            billingLabel={item.billingLabel}
            amountLabel={item.amountLabel}
            chargeable={item.chargeable}
            openLabel={openLabel}
            todayLabel={todayLabel}
          />
        </li>
      ))}
    </ul>
  );
}

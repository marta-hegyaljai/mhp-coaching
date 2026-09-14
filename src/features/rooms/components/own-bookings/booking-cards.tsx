import {
  BookingCard,
  bookingCardGridClass,
} from "@/features/rooms/components/booking-list/booking-card";
import type {OwnBookingItem} from "@/features/rooms/components/own-bookings/item";

/** Owner view of the shared card: the room leads, no owner line. */
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
    <ul className={bookingCardGridClass}>
      {items.map((item) => (
        <li key={item.id}>
          <BookingCard
            href={{pathname: "/rooms/bookings/[id]", params: {id: item.id}}}
            status={item.status}
            statusLabel={item.statusLabel}
            timeLabel={item.timeLabel}
            dateLabel={item.dateLabel}
            isToday={item.isToday}
            title={item.roomName}
            detail={item.durationLabel}
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

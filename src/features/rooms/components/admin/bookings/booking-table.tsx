import {bookingStatusRailClass} from "@/features/rooms/components/admin/bookings/item";
import type {AdminBookingItem} from "@/features/rooms/components/admin/bookings/item";
import {BookingStatusMark} from "@/features/rooms/components/admin/bookings/status-mark";
import {Link} from "@/i18n/navigation";
import {Price} from "@/shared/ui/price";

export type AdminBookingTableLabels = {
  when: string;
  therapist: string;
  room: string;
  duration: string;
  status: string;
  billing: string;
  amount: string;
  open: string;
  today: string;
};

export function AdminBookingTable({
  items,
  labels,
}: {
  items: AdminBookingItem[];
  labels: AdminBookingTableLabels;
}) {
  return (
    <div className="overflow-x-auto rounded-panel border border-ink">
      <table className="min-w-[44rem] w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-[0.14em] text-ink-subtle">
            <th className="px-4 py-3 font-medium">{labels.when}</th>
            <th className="px-4 py-3 font-medium">{labels.therapist}</th>
            <th className="px-4 py-3 font-medium">{labels.room}</th>
            <th className="px-4 py-3 font-medium">{labels.duration}</th>
            <th className="px-4 py-3 font-medium">{labels.status}</th>
            <th className="px-4 py-3 font-medium">{labels.billing}</th>
            <th className="px-4 py-3 font-medium text-right">{labels.amount}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className={`relative border-b border-line-soft last:border-b-0 border-l-[3px] transition-colors duration-150 ease-standard hover:bg-hover has-[a:focus-visible]:bg-hover ${bookingStatusRailClass(item.status)} ${
                item.status === "CANCELLED" ? "text-ink-muted" : "text-ink"
              }`}
            >
              <td className="px-4 py-3 align-top">
                <Link
                  href={{pathname: "/admin/bookings/[id]", params: {id: item.id}}}
                  className="rounded-panel after:absolute after:inset-0 focus-visible:outline-none"
                >
                  <span className="sr-only">{labels.open}: </span>
                  <span className="block font-sans font-semibold tabular-nums text-ink">
                    {item.timeLabel}
                  </span>
                </Link>
                <span className="mt-1 block text-xs leading-5 text-ink-muted">
                  {item.dateLabel}
                  {item.isToday ? (
                    <span className="ml-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-gold-deep">
                      {labels.today}
                    </span>
                  ) : null}
                </span>
              </td>
              <td className="px-4 py-3 align-top">
                <span className="block font-medium text-ink">{item.ownerName}</span>
                <span className="mt-1 block text-xs leading-5 text-ink-muted">{item.ownerEmail}</span>
              </td>
              <td className="px-4 py-3 align-top text-ink">{item.roomName}</td>
              <td className="px-4 py-3 align-top font-sans tabular-nums text-ink">
                {item.durationLabel}
              </td>
              <td className="px-4 py-3 align-top">
                <BookingStatusMark item={item} />
              </td>
              <td className="px-4 py-3 align-top text-ink">{item.billingLabel}</td>
              <td className="px-4 py-3 align-top text-right">
                <Price size="sm" tone={item.chargeable ? "strong" : "muted"}>
                  {item.amountLabel}
                </Price>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import type {Booking} from "@/db/schema";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {formatLongDate} from "@/shared/format/calendar-date";
import type {AppLocale} from "@/i18n/routing";

export function StaffBookingsTable({
  bookings,
  labels,
}: {
  bookings: Booking[];
  labels: {
    name: string;
    email: string;
    course: string;
    date: string;
    amount: string;
    status: string;
    created: string;
    paid: string;
    empty: string;
  };
}) {
  if (bookings.length === 0) {
    return <p className="text-sm text-ink-muted">{labels.empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-[0.14em] text-ink-subtle">
            <th className="py-3 pr-4 font-medium">{labels.name}</th>
            <th className="py-3 pr-4 font-medium">{labels.email}</th>
            <th className="py-3 pr-4 font-medium">{labels.course}</th>
            <th className="py-3 pr-4 font-medium">{labels.date}</th>
            <th className="py-3 pr-4 font-medium">{labels.amount}</th>
            <th className="py-3 pr-4 font-medium">{labels.status}</th>
            <th className="py-3 pr-4 font-medium">{labels.created}</th>
            <th className="py-3 font-medium">{labels.paid}</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id} className="border-b border-line/70 align-top">
              <td className="py-3 pr-4">
                {booking.firstName} {booking.lastName}
                {booking.dateOfBirth ? (
                  <div className="text-ink-subtle">
                    {formatLongDate(booking.dateOfBirth, booking.locale as AppLocale)}
                  </div>
                ) : null}
              </td>
              <td className="py-3 pr-4">
                {booking.email}
                <div className="text-ink-subtle">{booking.phone}</div>
              </td>
              <td className="py-3 pr-4">{booking.courseTitle}</td>
              <td className="py-3 pr-4">
                {booking.location}
                <div className="text-ink-subtle">
                  {booking.courseDateStart}
                  {booking.courseDateEnd ? ` – ${booking.courseDateEnd}` : ""}
                </div>
              </td>
              <td className="py-3 pr-4">
                {formatChf(minorUnitsToFrancs(booking.amountMinor), booking.locale)}
              </td>
              <td className="py-3 pr-4 font-medium">{booking.status}</td>
              <td className="py-3 pr-4 text-ink-muted">
                {booking.createdAt.toISOString()}
              </td>
              <td className="py-3">{booking.paidAt?.toISOString() ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

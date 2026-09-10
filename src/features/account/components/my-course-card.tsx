import {formatDateRange} from "@/features/courses/dates";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import type {Booking} from "@/db/schema";
import type {AppLocale} from "@/i18n/routing";
import {Price} from "@/shared/ui/price";

export function MyCourseCard({
  booking,
  locale,
  statusLabel,
}: {
  booking: Booking;
  locale: AppLocale;
  statusLabel: string;
}) {
  return (
    <article className="flex h-full flex-col border border-ink bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">
        {statusLabel}
      </p>
      <h3 className="mt-3 font-serif text-[clamp(1.35rem,1.6vw,1.65rem)] leading-[1.1]">
        {booking.courseTitle}
      </h3>
      <p className="mt-3 text-sm leading-6 text-ink-muted">
        {formatDateRange(booking.courseDateStart, booking.courseDateEnd, locale)}
      </p>
      <p className="mt-1 text-sm leading-6 text-ink-muted">{booking.location}</p>
      <div className="mt-auto pt-5">
        <Price size="sm">
          {formatChf(minorUnitsToFrancs(booking.amountMinor), locale, {compact: true})}
        </Price>
      </div>
    </article>
  );
}

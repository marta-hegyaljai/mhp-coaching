import {completeFakePaymentAction} from "@/features/payments/fake/complete-action";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import type {Booking} from "@/db/schema";
import type {AppLocale} from "@/i18n/routing";
import {Button} from "@/shared/ui/button";

export function FakeCheckoutPanel({
  booking,
  token,
  locale,
  payLabel,
  cancelLabel,
  amountLabel,
}: {
  booking: Booking;
  token: string;
  locale: AppLocale;
  payLabel: string;
  cancelLabel: string;
  amountLabel: string;
}) {
  const amount = formatChf(minorUnitsToFrancs(booking.amountMinor), locale);

  return (
    <div className="max-w-lg rounded-panel border border-line bg-parchment p-6 sm:p-8">
      <p className="font-serif text-subheading">{booking.courseTitle}</p>
      <p className="mt-2 text-sm text-ink-muted">
        {amountLabel.replace("{amount}", amount)}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <FakeCheckoutButton
          bookingId={booking.id}
          token={token}
          locale={locale}
          intent="pay"
          label={payLabel}
        />
        <FakeCheckoutButton
          bookingId={booking.id}
          token={token}
          locale={locale}
          intent="cancel"
          label={cancelLabel}
          variant="secondary"
        />
      </div>
    </div>
  );
}

function FakeCheckoutButton({
  bookingId,
  token,
  locale,
  intent,
  label,
  variant = "primary",
}: {
  bookingId: string;
  token: string;
  locale: AppLocale;
  intent: "pay" | "cancel";
  label: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <form action={completeFakePaymentAction} className="w-full sm:w-auto">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="intent" value={intent} />
      <Button type="submit" variant={variant} size="lg" block>
        {label}
      </Button>
    </form>
  );
}

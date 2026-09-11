"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert} from "@/features/auth/components/auth-field";
import {adminMoveRoomBookingAction} from "@/features/rooms/actions";
import {AmountSummary} from "@/features/rooms/components/booking/amount-summary";
import {SlotFields} from "@/features/rooms/components/booking/slot-fields";
import {useSlotSelection} from "@/features/rooms/components/booking/use-slot-selection";
import type {ReservationPreview} from "@/features/rooms/reservations";
import type {AppLocale} from "@/i18n/routing";
import {Panel, PanelDivider} from "@/shared/ui/panel";
import {SubmitButton} from "@/shared/ui/submit-button";

/** An admin move never charges a late cancellation; it relocates in place. */
export function AdminMoveBookingForm({
  locale,
  bookingId,
  preview,
}: {
  locale: AppLocale;
  bookingId: string;
  preview: ReservationPreview;
}) {
  const t = useTranslations("Rooms");
  const selection = useSlotSelection(preview);
  const [state, action, pending] = useActionState(
    adminMoveRoomBookingAction.bind(null, locale, bookingId),
    null,
  );
  const quote = selection.quote ?? preview.quote;

  return (
    <form action={action} className="space-y-6">
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      <input type="hidden" name="roomId" value={preview.room.id} />
      <input type="hidden" name="date" value={preview.date} />

      <Panel>
        <SlotFields starts={preview.starts} selection={selection} />
        <PanelDivider className="mt-6" />
        <div className="mt-6">
          <AmountSummary
            locale={locale}
            durationMinutes={quote.durationMinutes}
            rateMinor={preview.room.hourlyRateMinor}
            amountMinor={quote.amountMinor}
            discountPercent={quote.discountPercent}
            showBillingNote
          />
        </div>
      </Panel>

      <SubmitButton
        pending={pending}
        disabled={!selection.ready}
        label={t("confirmChange")}
        pendingLabel={t("confirmingChange")}
      />
    </form>
  );
}

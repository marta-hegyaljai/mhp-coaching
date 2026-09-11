"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {adminWaiveRoomBookingAction} from "@/features/rooms/actions";
import {DestructiveConfirm} from "@/features/rooms/components/booking/destructive-confirm";
import type {AppLocale} from "@/i18n/routing";

/**
 * Waiving is also a financial decision, so it uses the same confirmation shape
 * as a cancellation: the amount that stops being owed is shown explicitly.
 */
export function AdminWaiveBookingForm({
  locale,
  bookingId,
  amount,
}: {
  locale: AppLocale;
  bookingId: string;
  amount: string;
}) {
  const admin = useTranslations("Admin");
  const [state, action, pending] = useActionState(
    adminWaiveRoomBookingAction.bind(null, locale, bookingId),
    null,
  );

  return (
    <DestructiveConfirm
      label={admin("waiveCharge")}
      message={admin("waiveHelp", {amount})}
      retained={{label: admin("waiveAmount"), amount}}
      keep={{
        href: {pathname: "/admin/bookings/[id]", params: {id: bookingId}},
        label: admin("keepCharge"),
      }}
      confirm={{label: admin("waiveCharge"), pendingLabel: admin("waiving")}}
      action={action}
      pending={pending}
      error={state?.error}
    />
  );
}

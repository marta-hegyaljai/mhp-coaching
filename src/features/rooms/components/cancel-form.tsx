"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {cancelRoomBookingAction} from "@/features/rooms/actions";
import {DestructiveConfirm} from "@/features/rooms/components/booking/destructive-confirm";
import type {AppLocale} from "@/i18n/routing";

export function CancelBookingForm({
  locale,
  bookingId,
  late,
  amount,
}: {
  locale: AppLocale;
  bookingId: string;
  late: boolean;
  amount: string;
}) {
  const t = useTranslations("Rooms");
  const [state, action, pending] = useActionState(
    cancelRoomBookingAction.bind(null, locale, bookingId),
    null,
  );

  return (
    <DestructiveConfirm
      label={t("cancelTitle")}
      message={late ? t("cancelLateHelp", {amount}) : t("cancelFreeHelp")}
      note={t("releaseNote")}
      retained={late ? {label: t("retainedCharge"), amount} : undefined}
      keep={{
        href: {pathname: "/rooms/bookings/[id]", params: {id: bookingId}},
        label: t("keepBooking"),
      }}
      confirm={{label: t("confirmCancel"), pendingLabel: t("confirmingCancel")}}
      action={action}
      pending={pending}
      error={state?.error}
    />
  );
}

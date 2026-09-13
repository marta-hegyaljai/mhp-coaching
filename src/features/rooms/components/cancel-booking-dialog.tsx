"use client";

import {useActionState, useEffect, useRef} from "react";
import {useTranslations} from "next-intl";

import {cancelRoomBookingAction} from "@/features/rooms/actions";
import {DestructiveConfirm} from "@/features/rooms/components/booking/destructive-confirm";
import type {AppLocale} from "@/i18n/routing";
import {Button} from "@/shared/ui/button";

/** Opens a centered confirmation dialog before a therapist cancels a booking. */
export function CancelBookingDialog({
  locale,
  bookingId,
  late,
  amount,
  triggerLabel,
  defaultOpen = false,
}: {
  locale: AppLocale;
  bookingId: string;
  late: boolean;
  amount: string;
  triggerLabel: string;
  defaultOpen?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const t = useTranslations("Rooms");
  const [state, action, pending] = useActionState(
    cancelRoomBookingAction.bind(null, locale, bookingId),
    null,
  );

  function closeDialog() {
    dialogRef.current?.close();
  }

  function openDialog() {
    dialogRef.current?.showModal();
  }

  useEffect(() => {
    if (defaultOpen) {
      openDialog();
    }
  }, [defaultOpen]);

  return (
    <>
      {!defaultOpen ? (
        <Button type="button" variant="secondary" onClick={openDialog}>
          {triggerLabel}
        </Button>
      ) : null}

      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[min(28rem,calc(100%-1.5rem))] overflow-y-auto rounded-panel border border-ink bg-white p-0 text-ink backdrop:bg-ink/35"
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-serif text-subheading">{t("cancelTitle")}</h2>
            <Button type="button" variant="quiet" onClick={closeDialog}>
              {t("closeDialog")}
            </Button>
          </div>

          <DestructiveConfirm
            embedded
            label={t("cancelTitle")}
            message={late ? t("cancelLateHelp", {amount}) : t("cancelFreeHelp")}
            note={t("releaseNote")}
            retained={late ? {label: t("retainedCharge"), amount} : undefined}
            keep={{onClick: closeDialog, label: t("keepBooking")}}
            confirm={{label: t("confirmCancel"), pendingLabel: t("confirmingCancel")}}
            action={action}
            pending={pending}
            error={state?.error}
          />
        </div>
      </dialog>
    </>
  );
}

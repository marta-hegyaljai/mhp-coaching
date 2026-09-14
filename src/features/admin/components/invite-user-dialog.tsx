"use client";

import {useRef, useState} from "react";
import {useTranslations} from "next-intl";

import {InviteUserForm} from "@/features/admin/components/invite-form";
import {Button} from "@/shared/ui/button";

/** Opens the invite form in a centered dialog so it stays above the account list. */
export function InviteUserDialog({locale}: {locale: string}) {
  const t = useTranslations("Admin");
  const rooms = useTranslations("Rooms");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [formKey, setFormKey] = useState(0);

  function closeDialog() {
    dialogRef.current?.close();
  }

  function openDialog() {
    setFormKey((value) => value + 1);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <Button type="button" onClick={openDialog}>
        {t("invite")}
      </Button>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[min(32rem,calc(100%-1.5rem))] overflow-y-auto rounded-panel border border-ink bg-white p-0 text-ink backdrop:bg-ink/35"
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-serif text-subheading">{t("invite")}</h2>
            <Button type="button" variant="quiet" onClick={closeDialog}>
              {rooms("closeDialog")}
            </Button>
          </div>
          <p className="mt-3 text-sm leading-7 text-ink-muted">{t("inviteDialogIntro")}</p>
          <div className="mt-6">
            <InviteUserForm key={formKey} locale={locale} onDismiss={closeDialog} />
          </div>
        </div>
      </dialog>
    </>
  );
}

"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert, AuthNotice} from "@/features/auth/components/auth-field";
import {NoticePanel} from "@/features/rooms/components/booking/notice-panel";
import {savePrivateNoteAction} from "@/features/rooms/actions";
import {PRIVATE_NOTE_MAX_LENGTH} from "@/features/rooms/limits";
import type {AppLocale} from "@/i18n/routing";
import {Panel} from "@/shared/ui/panel";
import {TextareaField} from "@/shared/ui/field";
import {SubmitButton} from "@/shared/ui/submit-button";

export function PrivateNoteForm({
  locale,
  bookingId,
  initialText,
}: {
  locale: AppLocale;
  bookingId: string;
  initialText: string;
}) {
  const t = useTranslations("Rooms");
  const [state, action, pending] = useActionState(
    savePrivateNoteAction.bind(null, locale, bookingId),
    null,
  );

  return (
    <Panel>
      <h2 className="font-serif text-xl leading-tight">{t("privateNoteTitle")}</h2>
      <div className="mt-4">
        <NoticePanel label={t("privateNote")} message={t("privateNoteWarning")} />
      </div>
      <form action={action} className="mt-6 space-y-6">
        {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
        {state?.ok ? <AuthNotice>{t("noteSaved")}</AuthNotice> : null}
        <TextareaField
          key={`${bookingId}-${initialText}`}
          id="private-note"
          name="note"
          label={t("privateNote")}
          help={t("privateNoteHelp")}
          defaultValue={initialText}
          maxLength={PRIVATE_NOTE_MAX_LENGTH}
          autoComplete="off"
          spellCheck={false}
        />
        <div className="flex flex-wrap gap-3">
          <SubmitButton
            pending={pending}
            label={t("saveNote")}
            pendingLabel={t("savingNote")}
          />
          {initialText ? (
            <SubmitButton
              pending={pending}
              name="intent"
              value="delete"
              variant="secondary"
              label={t("deleteNote")}
              pendingLabel={t("deletingNote")}
            />
          ) : null}
        </div>
      </form>
    </Panel>
  );
}

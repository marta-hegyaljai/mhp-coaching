"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert} from "@/features/auth/components/auth-field";
import {resolveAvailabilityRequestAction} from "@/features/rooms/actions";
import {REQUEST_MESSAGE_MAX_LENGTH} from "@/features/rooms/limits";
import type {AppLocale} from "@/i18n/routing";
import {TextareaField} from "@/shared/ui/field";
import {Panel} from "@/shared/ui/panel";
import {SubmitButton} from "@/shared/ui/submit-button";

export function AdminRequestResolveForm({
  locale,
  requestId,
}: {
  locale: AppLocale;
  requestId: string;
}) {
  const t = useTranslations("Admin");
  const [state, action, pending] = useActionState(
    resolveAvailabilityRequestAction.bind(null, locale, requestId),
    null,
  );

  return (
    <Panel>
      <h2 className="font-serif text-xl leading-tight">{t("resolveRequest")}</h2>
      <form action={action} className="mt-6 space-y-6">
        {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
        <TextareaField
          id="admin-request-note"
          name="adminNote"
          label={t("adminRequestNote")}
          help={t("adminRequestNoteHelp")}
          maxLength={REQUEST_MESSAGE_MAX_LENGTH}
        />
        <div className="flex flex-wrap gap-3">
          <SubmitButton
            pending={pending}
            name="decision"
            value="RESOLVED"
            label={t("resolveRequest")}
            pendingLabel={t("resolving")}
          />
          <SubmitButton
            pending={pending}
            name="decision"
            value="DECLINED"
            variant="secondary"
            label={t("declineRequest")}
            pendingLabel={t("declining")}
          />
        </div>
      </form>
    </Panel>
  );
}

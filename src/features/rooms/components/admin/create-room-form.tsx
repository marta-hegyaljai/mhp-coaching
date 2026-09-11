"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert, AuthField, AuthNotice} from "@/features/auth/components/auth-field";
import {createRoomAction} from "@/features/rooms/actions";
import {SubmitButton} from "@/shared/ui/submit-button";

import {RoomDescriptionField} from "./description-field";

export function CreateRoomForm({locale}: {locale: string}) {
  const t = useTranslations("Rooms");
  const [state, action, pending] = useActionState(createRoomAction.bind(null, locale), null);

  return (
    <form action={action} className="max-w-xl space-y-5">
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      {state?.ok ? <AuthNotice>{t("saved")}</AuthNotice> : null}
      <AuthField name="name" label={t("name")} />
      <RoomDescriptionField label={t("description")} />
      <AuthField name="hourlyRate" label={t("hourlyRate")} />
      <p className="text-sm text-ink-muted">{t("hourlyRateHelp")}</p>
      <SubmitButton
        pending={pending}
        label={t("createRoom")}
        pendingLabel={t("saving")}
      />
    </form>
  );
}

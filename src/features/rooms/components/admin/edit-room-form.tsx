"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert, AuthField, AuthNotice} from "@/features/auth/components/auth-field";
import {minorUnitsToFrancs} from "@/features/payments/money";
import {updateRoomAction} from "@/features/rooms/actions";
import {Button} from "@/shared/ui/button";
import {StatusLabel} from "@/shared/ui/status-label";
import {SubmitButton} from "@/shared/ui/submit-button";

import {RoomDescriptionField} from "./description-field";

export type EditableRoom = {
  id: string;
  name: string;
  description: string;
  hourlyRateMinor: number;
  active: boolean;
};

export function EditRoomForm({locale, room}: {locale: string; room: EditableRoom}) {
  const t = useTranslations("Rooms");
  const [state, action, pending] = useActionState(
    updateRoomAction.bind(null, locale, room.id),
    null,
  );

  return (
    <div className="space-y-8">
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      {state?.ok ? <AuthNotice>{t("saved")}</AuthNotice> : null}

      <form action={action} className="max-w-xl space-y-5">
        <input type="hidden" name="intent" value="save" />
        <AuthField name="name" label={t("name")} defaultValue={room.name} />
        <RoomDescriptionField label={t("description")} defaultValue={room.description} />
        <AuthField
          name="hourlyRate"
          label={t("hourlyRate")}
          defaultValue={String(minorUnitsToFrancs(room.hourlyRateMinor))}
        />
        <SubmitButton
          pending={pending}
          label={t("save")}
          pendingLabel={t("saving")}
        />
      </form>

      <form
        action={action}
        className="flex max-w-xl flex-wrap items-center justify-between gap-4 rounded-panel border border-ink bg-white p-5"
      >
        <input type="hidden" name="intent" value={room.active ? "disable" : "enable"} />
        <div>
          <StatusLabel tone={room.active ? "ok" : "stop"}>
            {room.active ? t("active") : t("inactive")}
          </StatusLabel>
          <p className="mt-2 text-sm leading-6 text-ink-muted">{t("availabilityHelp")}</p>
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {room.active ? t("disable") : t("enable")}
        </Button>
      </form>
    </div>
  );
}

"use client";

import {useActionState, useState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert, AuthNotice} from "@/features/auth/components/auth-field";
import {saveRoomSettingsAction} from "@/features/rooms/actions";
import {SubmitButton} from "@/shared/ui/submit-button";

import {BookingRulesFields, type BookingRulesValues} from "./booking-rules";
import {OpeningHoursEditor, type OpeningHour} from "./opening-hours-editor";

export function RoomSettingsForm({
  locale,
  settings,
  hours,
}: {
  locale: string;
  settings: BookingRulesValues;
  hours: OpeningHour[];
}) {
  const t = useTranslations("Rooms");
  const [state, action, pending] = useActionState(
    saveRoomSettingsAction.bind(null, locale),
    null,
  );
  const [intervalMinutes, setIntervalMinutes] = useState(settings.bookingIntervalMinutes);

  return (
    <form action={action} className="space-y-12">
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      {state?.ok ? <AuthNotice>{t("saved")}</AuthNotice> : null}

      <section className="space-y-4">
        <h2 className="font-serif text-subheading">{t("hoursTitle")}</h2>
        <p className="max-w-2xl text-sm leading-7 text-ink-muted">{t("hoursHelp")}</p>
        <OpeningHoursEditor hours={hours} intervalMinutes={intervalMinutes} />
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-subheading">{t("rulesTitle")}</h2>
        <BookingRulesFields
          settings={settings}
          intervalMinutes={intervalMinutes}
          onIntervalChange={setIntervalMinutes}
        />
      </section>

      <SubmitButton
        pending={pending}
        label={t("saveSettings")}
        pendingLabel={t("saving")}
      />
    </form>
  );
}

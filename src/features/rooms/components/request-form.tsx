"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert} from "@/features/auth/components/auth-field";
import {createAvailabilityRequestAction} from "@/features/rooms/actions";
import {NoticePanel} from "@/features/rooms/components/booking/notice-panel";
import {REQUEST_MESSAGE_MAX_LENGTH} from "@/features/rooms/limits";
import type {AppLocale} from "@/i18n/routing";
import {DateField} from "@/shared/ui/date-field";
import {SelectField, TextareaField} from "@/shared/ui/field";
import {Panel} from "@/shared/ui/panel";
import {SubmitButton} from "@/shared/ui/submit-button";

export function AvailabilityRequestForm({
  locale,
  rooms,
  times,
  defaults,
}: {
  locale: AppLocale;
  rooms: Array<{id: string; name: string; active: boolean}>;
  times: string[];
  defaults: {roomId?: string; date?: string; start?: string; end?: string};
}) {
  const t = useTranslations("Rooms");
  const [state, action, pending] = useActionState(
    createAvailabilityRequestAction.bind(null, locale),
    null,
  );
  const startTimes = times.filter((time) => time !== "24:00");

  return (
    <form action={action} className="space-y-6">
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      <NoticePanel label={t("requestTitle")} message={t("requestDoesNotReserve")} />
      <Panel>
        <div className="space-y-6">
          <SelectField
            id="request-room"
            name="preferredRoomId"
            label={t("preferredRoom")}
            defaultValue={defaults.roomId ?? "any"}
          >
            <option value="any">{t("anyRoom")}</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.active ? room.name : `${room.name} (${t("inactive")})`}
              </option>
            ))}
          </SelectField>
          <DateField
            id="request-date"
            name="date"
            label={t("bookDate")}
            defaultValue={defaults.date}
            required
          />
          <SelectField
            id="request-start"
            name="start"
            label={t("bookStart")}
            numeric
            defaultValue={defaults.start}
            required
          >
            <option value="">{t("bookStart")}</option>
            {startTimes.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="request-end"
            name="end"
            label={t("bookEnd")}
            numeric
            defaultValue={defaults.end}
            required
          >
            <option value="">{t("bookEnd")}</option>
            {times.filter((time) => time !== "00:00").map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </SelectField>
          <TextareaField
            id="request-message"
            name="message"
            label={t("requestMessage")}
            help={t("requestMessageHelp")}
            maxLength={REQUEST_MESSAGE_MAX_LENGTH}
          />
        </div>
      </Panel>
      <NoticePanel label={t("requestMessage")} message={t("requestPatientWarning")} />
      <SubmitButton
        pending={pending}
        label={t("submitRequest")}
        pendingLabel={t("submittingRequest")}
      />
    </form>
  );
}

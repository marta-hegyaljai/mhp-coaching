"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {saveCallHoursAction} from "@/features/course-calls/actions";
import {CallHoursEditor} from "@/features/course-calls/components/hours-editor";
import type {CallHourInterval} from "@/features/course-calls/hours";
import {AuthAlert, AuthNotice} from "@/features/auth/components/auth-field";
import {SubmitButton} from "@/shared/ui/submit-button";

export function CallHoursForm({
  locale,
  hours,
}: {
  locale: string;
  hours: CallHourInterval[];
}) {
  const t = useTranslations("Admin");
  const [state, action, pending] = useActionState(
    saveCallHoursAction.bind(null, locale),
    null,
  );

  return (
    <form action={action} className="space-y-8">
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      {state?.ok ? <AuthNotice>{t("callHoursSaved")}</AuthNotice> : null}
      <p className="max-w-2xl text-sm leading-7 text-ink-muted">{t("callHoursHelp")}</p>
      <CallHoursEditor hours={hours} />
      <SubmitButton
        pending={pending}
        label={t("callHoursSave")}
        pendingLabel={t("saving")}
      />
    </form>
  );
}

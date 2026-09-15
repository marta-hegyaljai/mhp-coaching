"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {cancelCourseCallAction} from "@/features/course-calls/actions";
import {AuthAlert, AuthNotice} from "@/features/auth/components/auth-field";
import {SubmitButton} from "@/shared/ui/submit-button";

export function CancelCallForm({
  locale,
  callId,
}: {
  locale: string;
  callId: string;
}) {
  const t = useTranslations("Admin");
  const [state, action, pending] = useActionState(
    cancelCourseCallAction.bind(null, locale, callId),
    null,
  );

  if (state?.ok) {
    return <AuthNotice>{t("callCancelled")}</AuthNotice>;
  }

  return (
    <form action={action} className="space-y-4">
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      <p className="max-w-xl text-sm leading-7 text-ink-muted">{t("callCancelHelp")}</p>
      <SubmitButton
        pending={pending}
        label={t("callCancel")}
        pendingLabel={t("saving")}
        variant="secondary"
      />
    </form>
  );
}

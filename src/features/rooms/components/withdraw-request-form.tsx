"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert} from "@/features/auth/components/auth-field";
import {withdrawAvailabilityRequestAction} from "@/features/rooms/actions";
import type {AppLocale} from "@/i18n/routing";
import {SubmitButton} from "@/shared/ui/submit-button";

export function WithdrawRequestForm({
  locale,
  requestId,
}: {
  locale: AppLocale;
  requestId: string;
}) {
  const t = useTranslations("Rooms");
  const [state, action, pending] = useActionState(
    async () => withdrawAvailabilityRequestAction(locale, requestId),
    null,
  );

  return (
    <form action={action} className="space-y-4">
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      <SubmitButton
        pending={pending}
        variant="secondary"
        label={t("withdrawRequest")}
        pendingLabel={t("withdrawing")}
      />
    </form>
  );
}

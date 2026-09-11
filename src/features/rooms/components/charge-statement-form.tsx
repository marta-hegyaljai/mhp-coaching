"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {chargeStatementAction} from "@/features/rooms/billing-actions";
import {AuthAlert, AuthNotice} from "@/features/auth/components/auth-field";
import {Button} from "@/shared/ui/button";
import {SpinnerIcon} from "@/shared/ui/icons";

export function ChargeStatementForm({
  locale,
  statementId,
  userId,
  retry,
}: {
  locale: string;
  statementId: string;
  userId: string;
  retry?: boolean;
}) {
  const t = useTranslations("Admin");
  const [state, formAction, pending] = useActionState(
    chargeStatementAction.bind(null, locale, statementId, userId),
    null,
  );

  return (
    <form action={formAction} className="mt-6 max-w-xl space-y-4">
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      {state?.ok ? <AuthNotice>{retry ? t("chargeRetried") : t("chargeStarted")}</AuthNotice> : null}
      <p className="text-sm leading-7 text-ink-muted">
        {retry ? t("retryChargeHelp") : t("chargeNowHelp")}
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <SpinnerIcon />
            {t("charging")}
          </>
        ) : retry ? (
          t("retryCharge")
        ) : (
          t("chargeNow")
        )}
      </Button>
    </form>
  );
}

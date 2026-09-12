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
  mode,
}: {
  locale: string;
  statementId: string;
  userId: string;
  retry?: boolean;
  mode?: "charge" | "retry" | "resume";
}) {
  const t = useTranslations("Admin");
  const action = mode ?? (retry ? "retry" : "charge");
  const [state, formAction, pending] = useActionState(
    chargeStatementAction.bind(null, locale, statementId, userId),
    null,
  );

  const notice =
    action === "retry" ? t("chargeRetried") : action === "resume" ? t("chargeResumed") : t("chargeStarted");
  const help =
    action === "retry" ? t("retryChargeHelp") : action === "resume" ? t("resumeChargeHelp") : t("chargeNowHelp");
  const label =
    action === "retry" ? t("retryCharge") : action === "resume" ? t("resumeCharge") : t("chargeNow");

  return (
    <form action={formAction} className="mt-6 max-w-xl space-y-4">
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      {state?.ok ? <AuthNotice>{notice}</AuthNotice> : null}
      <p className="text-sm leading-7 text-ink-muted">{help}</p>
      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <SpinnerIcon />
            {t("charging")}
          </>
        ) : (
          label
        )}
      </Button>
    </form>
  );
}

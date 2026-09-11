"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {addStatementAdjustmentAction} from "@/features/rooms/billing-actions";
import {AuthAlert, AuthNotice} from "@/features/auth/components/auth-field";
import {Button} from "@/shared/ui/button";
import {InputField, TextareaField} from "@/shared/ui/field";
import {SpinnerIcon} from "@/shared/ui/icons";

export function StatementAdjustmentForm({
  locale,
  statementId,
  userId,
}: {
  locale: string;
  statementId: string;
  userId: string;
}) {
  const t = useTranslations("Admin");
  const [state, formAction, pending] = useActionState(
    addStatementAdjustmentAction.bind(null, locale, statementId, userId),
    null,
  );

  return (
    <section className="mt-12 max-w-xl">
      <h2 className="font-serif text-subheading">{t("adjustmentTitle")}</h2>
      <p className="mt-3 text-sm leading-7 text-ink-muted">{t("adjustmentHelp")}</p>
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      {state?.ok ? <AuthNotice>{t("adjustmentAdded")}</AuthNotice> : null}
      <form action={formAction} className="mt-5 space-y-5">
        <InputField
          id="amount"
          name="amount"
          numeric
          inputMode="decimal"
          required
          label={t("adjustmentAmount")}
          help={t("adjustmentAmountHelp")}
        />
        <TextareaField
          id="reason"
          name="reason"
          required
          minLength={3}
          maxLength={500}
          rows={4}
          label={t("adjustmentReason")}
          help={t("adjustmentReasonHelp")}
        />
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <SpinnerIcon />
              {t("saving")}
            </>
          ) : (
            t("addAdjustment")
          )}
        </Button>
      </form>
    </section>
  );
}

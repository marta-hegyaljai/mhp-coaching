"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {finalizeStatementAction} from "@/features/rooms/billing-actions";
import {AuthAlert, AuthNotice} from "@/features/auth/components/auth-field";
import {Button} from "@/shared/ui/button";
import {SpinnerIcon} from "@/shared/ui/icons";

export function FinalizeStatementForm({
  locale,
  userId,
  monthKey,
  disabled,
}: {
  locale: string;
  userId: string;
  monthKey: string;
  disabled?: boolean;
}) {
  const t = useTranslations("Admin");
  const [state, formAction, pending] = useActionState(
    finalizeStatementAction.bind(null, locale, userId, monthKey),
    null,
  );

  return (
    <form action={formAction} className="mt-6 max-w-xl space-y-4">
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      {state?.ok ? <AuthNotice>{t("statementFinalized")}</AuthNotice> : null}
      <Button type="submit" disabled={pending || disabled}>
        {pending ? (
          <>
            <SpinnerIcon />
            {t("finalizing")}
          </>
        ) : (
          t("finalizeMonth")
        )}
      </Button>
    </form>
  );
}

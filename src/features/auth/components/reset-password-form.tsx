"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {resetPasswordAction} from "@/features/auth/actions";
import {AuthAlert, AuthField} from "@/features/auth/components/auth-field";
import {PASSWORD_MIN_LENGTH} from "@/features/auth/constants";
import {Button} from "@/shared/ui/button";
import {SpinnerIcon} from "@/shared/ui/icons";

export function ResetPasswordForm({
  locale,
  token,
}: {
  locale: string;
  token: string;
}) {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(
    resetPasswordAction.bind(null, locale, token),
    null,
  );

  return (
    <form action={formAction} className="max-w-xl space-y-5" aria-busy={pending}>
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      {state?.fieldErrors ? <AuthAlert>{t("passwordNotSaved")}</AuthAlert> : null}
      <AuthField
        name="password"
        type="password"
        label={t("password")}
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        hint={t("passwordRequirement")}
        error={state?.fieldErrors?.password}
      />
      <AuthField
        name="passwordConfirm"
        type="password"
        label={t("passwordConfirm")}
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        error={state?.fieldErrors?.passwordConfirm}
      />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <>
            <SpinnerIcon />
            {t("resetSubmitting")}
          </>
        ) : (
          t("resetSubmit")
        )}
      </Button>
    </form>
  );
}

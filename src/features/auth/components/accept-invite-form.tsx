"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {acceptInviteAction} from "@/features/auth/actions";
import {AuthAlert, AuthField} from "@/features/auth/components/auth-field";
import {Button} from "@/shared/ui/button";
import {SpinnerIcon} from "@/shared/ui/icons";

export function AcceptInviteForm({
  locale,
  token,
}: {
  locale: string;
  token: string;
}) {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(
    acceptInviteAction.bind(null, locale, token),
    null,
  );

  return (
    <form action={formAction} noValidate className="max-w-xl space-y-5" aria-busy={pending}>
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      <AuthField
        name="password"
        type="password"
        label={t("password")}
        autoComplete="new-password"
        error={state?.fieldErrors?.password}
      />
      <AuthField
        name="passwordConfirm"
        type="password"
        label={t("passwordConfirm")}
        autoComplete="new-password"
        error={state?.fieldErrors?.passwordConfirm}
      />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <>
            <SpinnerIcon />
            {t("inviteSubmitting")}
          </>
        ) : (
          t("inviteSubmit")
        )}
      </Button>
    </form>
  );
}

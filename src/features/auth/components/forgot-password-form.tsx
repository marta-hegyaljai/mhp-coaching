"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {forgotPasswordAction} from "@/features/auth/actions";
import {AuthAlert, AuthField, AuthNotice} from "@/features/auth/components/auth-field";
import {Link} from "@/i18n/navigation";
import {Button} from "@/shared/ui/button";
import {SpinnerIcon} from "@/shared/ui/icons";

export function ForgotPasswordForm({locale}: {locale: string}) {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction.bind(null, locale),
    null,
  );

  return (
    <form action={formAction} noValidate className="max-w-xl space-y-5" aria-busy={pending}>
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      {state?.notice ? <AuthNotice>{state.notice}</AuthNotice> : null}
      <AuthField
        name="email"
        type="email"
        label={t("email")}
        autoComplete="email"
        error={state?.fieldErrors?.email}
      />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <>
            <SpinnerIcon />
            {t("forgotSubmitting")}
          </>
        ) : (
          t("forgotSubmit")
        )}
      </Button>
      <p className="text-sm leading-6 text-ink-muted">
        <Link href="/sign-in" className="text-ink underline-offset-4 hover:underline">
          {t("signInLink")}
        </Link>
      </p>
    </form>
  );
}

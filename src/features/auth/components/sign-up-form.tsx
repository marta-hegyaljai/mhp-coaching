"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {signUpAction} from "@/features/auth/actions";
import {AuthAlert, AuthField, AuthNotice} from "@/features/auth/components/auth-field";
import {Link} from "@/i18n/navigation";
import {Button} from "@/shared/ui/button";
import {SpinnerIcon} from "@/shared/ui/icons";

export function SignUpForm({locale}: {locale: string}) {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(
    signUpAction.bind(null, locale),
    null,
  );

  return (
    <form action={formAction} noValidate className="max-w-xl space-y-5" aria-busy={pending}>
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      {state?.notice ? <AuthNotice>{state.notice}</AuthNotice> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <AuthField
          name="firstName"
          label={t("firstName")}
          autoComplete="given-name"
          error={state?.fieldErrors?.firstName}
        />
        <AuthField
          name="lastName"
          label={t("lastName")}
          autoComplete="family-name"
          error={state?.fieldErrors?.lastName}
        />
      </div>
      <AuthField
        name="email"
        type="email"
        label={t("email")}
        autoComplete="email"
        error={state?.fieldErrors?.email}
      />
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
            {t("signUpSubmitting")}
          </>
        ) : (
          t("signUpSubmit")
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

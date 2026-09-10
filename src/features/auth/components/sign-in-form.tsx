"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {signInAction} from "@/features/auth/actions";
import {AuthAlert, AuthField} from "@/features/auth/components/auth-field";
import {Link} from "@/i18n/navigation";
import {Button} from "@/shared/ui/button";
import {SpinnerIcon} from "@/shared/ui/icons";

export function SignInForm({
  locale,
  nextPath,
}: {
  locale: string;
  nextPath: string;
}) {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(
    signInAction.bind(null, locale, nextPath),
    null,
  );

  return (
    <form action={formAction} noValidate className="max-w-xl space-y-5" aria-busy={pending}>
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      <AuthField
        name="email"
        type="email"
        label={t("email")}
        autoComplete="username"
        error={state?.fieldErrors?.email}
      />
      <AuthField
        name="password"
        type="password"
        label={t("password")}
        autoComplete="current-password"
        error={state?.fieldErrors?.password}
      />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <>
            <SpinnerIcon />
            {t("submitting")}
          </>
        ) : (
          t("submit")
        )}
      </Button>
      <p className="text-sm leading-6 text-ink-muted">
        <Link href="/forgot-password" className="text-ink underline-offset-4 hover:underline">
          {t("forgotLink")}
        </Link>
        {" · "}
        <Link href="/sign-up" className="text-ink underline-offset-4 hover:underline">
          {t("signUpLink")}
        </Link>
      </p>
    </form>
  );
}

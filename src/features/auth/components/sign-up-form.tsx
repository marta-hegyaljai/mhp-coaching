"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {signUpAction} from "@/features/auth/actions";
import {AuthAlert, AuthField, AuthNotice} from "@/features/auth/components/auth-field";
import {PASSWORD_MIN_LENGTH} from "@/features/auth/constants";
import {Link} from "@/i18n/navigation";
import {Button} from "@/shared/ui/button";
import {SpinnerIcon} from "@/shared/ui/icons";

export function SignUpForm({locale}: {locale: string}) {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(
    signUpAction.bind(null, locale),
    null,
  );

  if (state?.notice) {
    return (
      <div className="max-w-xl space-y-5">
        <AuthNotice>{state.notice}</AuthNotice>
        <p className="text-sm leading-7 text-ink-muted">{t("confirmEmailHelp")}</p>
        <p className="text-sm leading-6 text-ink-muted">
          <Link href="/sign-in" className="text-ink underline-offset-4 hover:underline">
            {t("signInLink")}
          </Link>
        </p>
      </div>
    );
  }

  const values = state?.values;

  return (
    <form
      action={formAction}
      noValidate
      className="max-w-xl space-y-5"
      aria-busy={pending}
      key={state?.formKey ?? "sign-up"}
    >
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <AuthField
          name="firstName"
          label={t("firstName")}
          autoComplete="given-name"
          defaultValue={values?.firstName}
          error={state?.fieldErrors?.firstName}
        />
        <AuthField
          name="lastName"
          label={t("lastName")}
          autoComplete="family-name"
          defaultValue={values?.lastName}
          error={state?.fieldErrors?.lastName}
        />
      </div>
      <AuthField
        name="email"
        type="email"
        label={t("email")}
        autoComplete="email"
        defaultValue={values?.email}
        error={state?.fieldErrors?.email}
      />
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

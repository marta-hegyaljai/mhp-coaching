"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {changePasswordAction, updateProfileAction} from "@/features/auth/actions";
import {
  AuthAlert,
  AuthField,
  AuthNotice,
  AuthSelect,
} from "@/features/auth/components/auth-field";
import {Button} from "@/shared/ui/button";
import {SpinnerIcon} from "@/shared/ui/icons";

type ProfileValues = {
  firstName: string;
  lastName: string;
  email: string;
  locale: string;
};

export function ProfileForm({locale, user}: {locale: string; user: ProfileValues}) {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(
    updateProfileAction.bind(null, locale),
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
          defaultValue={user.firstName}
          error={state?.fieldErrors?.firstName}
        />
        <AuthField
          name="lastName"
          label={t("lastName")}
          autoComplete="family-name"
          defaultValue={user.lastName}
          error={state?.fieldErrors?.lastName}
        />
      </div>
      <AuthField
        name="email"
        type="email"
        label={t("email")}
        autoComplete="username"
        defaultValue={user.email}
        readOnly
        describedBy="account-email-locked"
      />
      <p id="account-email-locked" className="text-sm leading-6 text-ink-muted">
        {t("emailLockedNote")}
      </p>
      <AuthSelect
        name="locale"
        label={t("locale")}
        defaultValue={user.locale}
        error={state?.fieldErrors?.locale}
        options={[
          {value: "fr", label: t("localeFr")},
          {value: "de", label: t("localeDe")},
          {value: "en", label: t("localeEn")},
        ]}
      />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <>
            <SpinnerIcon />
            {t("profileSubmitting")}
          </>
        ) : (
          t("profileSubmit")
        )}
      </Button>
    </form>
  );
}

export function ChangePasswordForm({locale}: {locale: string}) {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(
    changePasswordAction.bind(null, locale),
    null,
  );

  return (
    <form action={formAction} noValidate className="max-w-xl space-y-5" aria-busy={pending}>
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      {state?.notice ? <AuthNotice>{state.notice}</AuthNotice> : null}
      <AuthField
        name="currentPassword"
        type="password"
        label={t("currentPassword")}
        autoComplete="current-password"
        error={state?.fieldErrors?.currentPassword}
      />
      <AuthField
        name="password"
        type="password"
        label={t("newPassword")}
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
            {t("passwordSubmitting")}
          </>
        ) : (
          t("passwordSubmit")
        )}
      </Button>
    </form>
  );
}

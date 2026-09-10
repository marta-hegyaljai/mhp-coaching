"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import type {AuthFormState} from "@/features/auth/actions";
import {AuthAlert} from "@/features/auth/components/auth-field";
import {Button} from "@/shared/ui/button";
import {SpinnerIcon} from "@/shared/ui/icons";

export function TokenConfirmForm({
  locale,
  token,
  action,
  submitLabel,
  submittingLabel,
}: {
  locale: string;
  token: string;
  action: (
    locale: string,
    token: string,
    previous: AuthFormState | null,
    formData: FormData,
  ) => Promise<AuthFormState>;
  submitLabel: string;
  submittingLabel: string;
}) {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(
    action.bind(null, locale, token),
    null,
  );

  return (
    <form action={formAction} className="max-w-xl space-y-5" aria-busy={pending}>
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <>
            <SpinnerIcon />
            {submittingLabel}
          </>
        ) : (
          submitLabel
        )}
      </Button>
      {state?.error ? (
        <p className="text-sm text-ink-muted">{t("verifyFailedHint")}</p>
      ) : null}
    </form>
  );
}

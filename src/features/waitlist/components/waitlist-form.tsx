"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {createWaitlistAction} from "@/features/waitlist/actions";
import type {Course} from "@/features/courses/types";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Button} from "@/shared/ui/button";
import {fieldLabelClass, fieldStyles} from "@/shared/ui/field";
import {SpinnerIcon} from "@/shared/ui/icons";

export function WaitlistForm({
  locale,
  course,
  defaults,
}: {
  locale: AppLocale;
  course: Course;
  defaults?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}) {
  const t = useTranslations("WaitlistForm");
  const [state, formAction, pending] = useActionState(
    createWaitlistAction.bind(null, locale, course.id),
    null,
  );

  if (state?.ok) {
    return (
      <p
        role="status"
        className="border border-ink bg-white px-4 py-5 text-sm leading-7 text-ink"
      >
        {t("success")}
      </p>
    );
  }

  if (state?.alreadyListed) {
    return (
      <p
        role="status"
        className="border border-ink bg-white px-4 py-5 text-sm leading-7 text-ink"
      >
        {t("alreadyListed")}
      </p>
    );
  }

  const errors = state?.errors;
  const draft = state?.draft;

  return (
    <form action={formAction} noValidate className="max-w-xl space-y-5" aria-busy={pending}>
      {errors?.form ? (
        <p role="alert" className="border border-bronze/45 px-4 py-3 text-sm text-bronze">
          {errors.form}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          name="firstName"
          label={t("firstName")}
          error={errors?.firstName}
          defaultValue={draft?.firstName ?? defaults?.firstName}
          autoComplete="given-name"
        />
        <Field
          name="lastName"
          label={t("lastName")}
          error={errors?.lastName}
          defaultValue={draft?.lastName ?? defaults?.lastName}
          autoComplete="family-name"
        />
        <Field
          name="email"
          type="email"
          inputMode="email"
          label={t("email")}
          error={errors?.email}
          defaultValue={draft?.email ?? defaults?.email}
          autoComplete="email"
        />
        <Field
          name="phone"
          type="tel"
          inputMode="tel"
          label={t("phone")}
          error={errors?.phone}
          defaultValue={draft?.phone ?? defaults?.phone}
          autoComplete="tel"
        />
      </div>

      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">{t("company")}</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="flex items-start gap-3 text-sm leading-6 text-ink-muted">
        <input
          type="checkbox"
          name="privacyAccepted"
          required
          className="mt-1 h-4 w-4 rounded-panel border-ink"
        />
        <span>
          {t.rich("privacy", {
            privacy: (chunks) => (
              <Link href="/legal/privacy" className="underline underline-offset-4">
                {chunks}
              </Link>
            ),
            terms: (chunks) => (
              <Link href="/legal/terms" className="underline underline-offset-4">
                {chunks}
              </Link>
            ),
          })}
        </span>
      </label>
      {errors?.privacyAccepted ? (
        <p role="alert" className="text-sm text-bronze">
          {errors.privacyAccepted}
        </p>
      ) : null}

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
    </form>
  );
}

function Field({
  name,
  label,
  error,
  type = "text",
  inputMode,
  autoComplete,
  defaultValue,
}: {
  name: string;
  label: string;
  error?: string;
  type?: string;
  inputMode?: "email" | "tel" | "text";
  autoComplete?: string;
  defaultValue?: string;
}) {
  const errorId = `${name}-error`;

  return (
    <div>
      <label htmlFor={name} className={fieldLabelClass}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-2 ${fieldStyles({invalid: Boolean(error)})}`}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-bronze">
          {error}
        </p>
      ) : null}
    </div>
  );
}

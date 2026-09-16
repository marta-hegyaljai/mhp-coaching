"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {createCourseInquiryAction} from "@/features/course-calls/actions";
import type {AppLocale} from "@/i18n/routing";
import {InputField, TextareaField} from "@/shared/ui/field";
import {LegalDocLink} from "@/shared/ui/legal-doc-link";
import {SubmitButton} from "@/shared/ui/submit-button";

export function InquiryComposer({
  locale,
  courseId,
  defaults,
}: {
  locale: AppLocale;
  courseId: string;
  defaults?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}) {
  const t = useTranslations("CourseAdvice");
  const [state, formAction, pending] = useActionState(
    createCourseInquiryAction.bind(null, locale, courseId),
    null,
  );

  if (state?.ok) {
    return (
      <p role="status" className="border border-ink bg-white px-5 py-6 text-sm leading-7 text-ink">
        {t("writeSuccess")}
      </p>
    );
  }

  const errors = state?.errors;
  const draft = state?.draft;

  return (
    <form action={formAction} noValidate className="max-w-xl space-y-5" aria-busy={pending}>
      {errors?.form ? (
        <p role="alert" className="border border-ink px-4 py-3 text-sm text-ink">
          {errors.form}
        </p>
      ) : null}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company-write">{t("company")}</label>
        <input id="company-write" name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <InputField
          id="firstName"
          name="firstName"
          label={t("firstName")}
          autoComplete="given-name"
          required
          defaultValue={draft?.firstName ?? defaults?.firstName}
          error={errors?.firstName}
        />
        <InputField
          id="lastName"
          name="lastName"
          label={t("lastName")}
          autoComplete="family-name"
          required
          defaultValue={draft?.lastName ?? defaults?.lastName}
          error={errors?.lastName}
        />
        <InputField
          id="email"
          name="email"
          type="email"
          inputMode="email"
          label={t("email")}
          autoComplete="email"
          required
          defaultValue={draft?.email ?? defaults?.email}
          error={errors?.email}
        />
        <InputField
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          label={t("phone")}
          autoComplete="tel"
          required
          defaultValue={draft?.phone ?? defaults?.phone}
          error={errors?.phone}
        />
      </div>
      <TextareaField
        id="message"
        name="message"
        label={t("message")}
        rows={6}
        required
        defaultValue={draft?.message}
        error={errors?.message}
      />
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
              <LegalDocLink href="/legal/privacy" className="underline underline-offset-4">
                {chunks}
              </LegalDocLink>
            ),
          })}
        </span>
      </label>
      {errors?.privacyAccepted ? (
        <p role="alert" className="text-sm text-ink">
          {errors.privacyAccepted}
        </p>
      ) : null}
      <SubmitButton
        pending={pending}
        label={t("submitWrite")}
        pendingLabel={t("submitting")}
      />
    </form>
  );
}

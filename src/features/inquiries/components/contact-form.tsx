"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {createInquiryAction} from "@/features/inquiries/actions";
import type {AppLocale} from "@/i18n/routing";
import {Button} from "@/shared/ui/button";
import {SpinnerIcon} from "@/shared/ui/icons";

export function ContactForm({
  locale,
  kind = "general",
  bookingId,
  courseId,
  courseTitle,
}: {
  locale: AppLocale;
  kind?: "general" | "payment";
  bookingId?: string;
  courseId?: string;
  courseTitle?: string;
}) {
  const t = useTranslations("ContactForm");
  const [state, formAction, pending] = useActionState(
    createInquiryAction.bind(null, locale, {kind, bookingId, courseId, courseTitle}),
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

  const errors = state?.errors;
  const draft = state?.draft;

  return (
    <form action={formAction} noValidate className="space-y-5" aria-busy={pending}>
      {errors?.form ? (
        <p role="alert" className="border border-bronze/45 px-4 py-3 text-sm text-bronze">
          {errors.form}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="name" label={t("name")} error={errors?.name} defaultValue={draft?.name} autoComplete="name" />
        <Field
          name="email"
          type="email"
          inputMode="email"
          label={t("email")}
          error={errors?.email}
          defaultValue={draft?.email}
          autoComplete="email"
        />
        <Field
          name="phone"
          type="tel"
          inputMode="tel"
          label={t("phone")}
          error={errors?.phone}
          defaultValue={draft?.phone}
          autoComplete="tel"
          required={false}
        />
        <div className="hidden" aria-hidden="true">
          <label htmlFor="company">{t("company")}</label>
          <input id="company" name="company" tabIndex={-1} autoComplete="off" />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-ink">
          {t("message")}
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          defaultValue={draft?.message}
          aria-invalid={errors?.message ? true : undefined}
          className={`mt-2 block w-full rounded-panel border bg-white px-3.5 py-3 text-base text-ink focus:border-ink ${
            errors?.message ? "border-bronze" : "border-line"
          }`}
        />
        {errors?.message ? (
          <p role="alert" className="mt-1.5 text-sm text-bronze">
            {errors.message}
          </p>
        ) : null}
      </div>

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
  required = true,
}: {
  name: string;
  label: string;
  error?: string;
  type?: string;
  inputMode?: "email" | "tel" | "text";
  autoComplete?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required={required}
        aria-invalid={error ? true : undefined}
        className={`mt-2 block min-h-12 w-full rounded-panel border bg-white px-3.5 text-base text-ink focus:border-ink ${
          error ? "border-bronze" : "border-line"
        }`}
      />
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-bronze">
          {error}
        </p>
      ) : null}
    </div>
  );
}

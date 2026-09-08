"use client";

import {useActionState, useState} from "react";
import {useTranslations} from "next-intl";

import {createBookingAction} from "@/features/bookings/actions";
import {unscheduledCourseDateId} from "@/features/bookings/booking-date";
import {formatCourseDateRange} from "@/features/courses/dates";
import type {Course, CourseDate} from "@/features/courses/types";
import {formatChf} from "@/features/payments/money";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Button} from "@/shared/ui/button";
import {CheckIcon, LockIcon, SpinnerIcon} from "@/shared/ui/icons";
import {Price} from "@/shared/ui/price";

export function BookingForm({
  locale,
  course,
  dates,
  initialDateId,
}: {
  locale: AppLocale;
  course: Course;
  dates: CourseDate[];
  initialDateId?: string;
}) {
  const t = useTranslations("BookingForm");
  const [state, formAction, pending] = useActionState(
    createBookingAction.bind(null, locale, course.id),
    null,
  );
  const errors = state?.errors;
  const draft = state?.draft;
  const schedulePending = dates.length === 0;
  const pendingDateId = unscheduledCourseDateId(course.id);
  const [selectedDateId, setSelectedDateId] = useState(
    () =>
      dates.find((date) => date.id === initialDateId)?.id ??
      dates[0]?.id ??
      pendingDateId,
  );

  const selectedDate =
    dates.find((date) => date.id === selectedDateId) ?? dates[0];
  const price = formatChf(course.priceChf, locale, {compact: true});
  // The submit button sits away from the fields on phones, so a rejected
  // submission needs a signal next to the button the visitor just pressed.
  const fieldErrorCount = errors
    ? Object.keys(errors).filter((key) => key !== "form").length
    : 0;

  return (
    <form
      action={formAction}
      aria-busy={pending}
      // Fields keep `required` for assistive tech, but browser bubbles are
      // suppressed so visitors see our localized, styled messages instead.
      noValidate
      className="grid gap-10 lg:grid-cols-12 lg:gap-16"
    >
      <div className="space-y-8 lg:col-span-7">
        {errors?.form ? (
          <p
            role="alert"
            className="rounded-panel border border-bronze/45 bg-parchment px-4 py-3 text-sm text-bronze"
          >
            {errors.form}
          </p>
        ) : null}

        {schedulePending ? (
          <div className="border border-ink bg-white p-5">
            <input type="hidden" name="courseDateId" value={pendingDateId} />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bronze">
              {t("dateLabel")}
            </p>
            <p className="mt-2 font-serif text-subheading">
              {t("dateToBeConfirmed")}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              {t("schedulePendingNote")}
            </p>
          </div>
        ) : (
          <fieldset>
            <legend className="text-sm font-medium text-ink">
              {t("dateLabel")}
            </legend>
            <div className="mt-3 space-y-2.5">
              {dates.map((date) => {
                const isSelected = date.id === selectedDate?.id;

                return (
                  <label
                    key={date.id}
                    className={`flex min-h-14 cursor-pointer items-center gap-4 rounded-panel border px-4 py-3.5 transition duration-200 ease-standard has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bronze ${
                      isSelected
                        ? "border-ink bg-parchment"
                        : "border-line bg-parchment/60 hover:border-ink/25"
                    }`}
                  >
                    <input
                      type="radio"
                      name="courseDateId"
                      value={date.id}
                      checked={isSelected}
                      onChange={() => setSelectedDateId(date.id)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition duration-200 ${
                        isSelected
                          ? "border-bronze bg-bronze text-ivory"
                          : "border-line bg-ivory"
                      }`}
                    >
                      {isSelected ? <CheckIcon className="h-3 w-3" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">
                        {date.location[locale]}
                      </span>
                      <span className="block text-sm text-ink-muted">
                        {formatCourseDateRange(date, locale)}
                      </span>
                    </span>
                    <Price size="sm" className="shrink-0">
                      {price}
                    </Price>
                  </label>
                );
              })}
            </div>
            {errors?.courseDateId ? (
              <p role="alert" className="mt-2 text-sm text-bronze">
                {errors.courseDateId}
              </p>
            ) : null}
          </fieldset>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            name="firstName"
            autoComplete="given-name"
            label={t("firstName")}
            error={errors?.firstName}
            defaultValue={draft?.firstName}
          />
          <Field
            name="lastName"
            autoComplete="family-name"
            label={t("lastName")}
            error={errors?.lastName}
            defaultValue={draft?.lastName}
          />
          <Field
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            label={t("email")}
            error={errors?.email}
            defaultValue={draft?.email}
          />
          <Field
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            label={t("phone")}
            error={errors?.phone}
            defaultValue={draft?.phone}
          />
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3 rounded-panel border border-line bg-parchment/60 p-4 text-sm leading-6 transition duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bronze">
            <input
              type="checkbox"
              name="privacyAccepted"
              required
              aria-invalid={errors?.privacyAccepted ? true : undefined}
              className="mt-0.5 h-5 w-5 shrink-0"
            />
            <span className="text-ink-muted">
              {t.rich("privacy", {
                privacy: (chunks) => (
                  <Link
                    href="/legal/privacy"
                    className="text-bronze underline underline-offset-2"
                  >
                    {chunks}
                  </Link>
                ),
                terms: (chunks) => (
                  <Link
                    href="/legal/terms"
                    className="text-bronze underline underline-offset-2"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </span>
          </label>
          {errors?.privacyAccepted ? (
            <p role="alert" className="mt-2 text-sm text-bronze">
              {errors.privacyAccepted}
            </p>
          ) : null}
        </div>
      </div>

      <aside className="lg:col-span-5">
        <div className="lg:sticky lg:top-24">
          <div className="rounded-panel border border-line bg-parchment p-6">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-bronze">
              {t("summaryTitle")}
            </p>
            <p className="mt-3 font-serif text-subheading">
              {course.title[locale]}
            </p>

            <dl className="mt-5 space-y-3 border-t border-line-soft pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-subtle">{t("summaryDate")}</dt>
                <dd className="text-right font-medium">
                  {schedulePending
                    ? t("dateToBeConfirmed")
                    : selectedDate
                    ? formatCourseDateRange(selectedDate, locale)
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-subtle">{t("summaryLocation")}</dt>
                <dd className="text-right font-medium">
                  {selectedDate
                    ? selectedDate.location[locale]
                    : course.location[locale]}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex items-center justify-between gap-4 border-t border-line-soft pt-4">
              <p className="text-sm text-ink-muted">{t("summaryTotal")}</p>
              <Price size="lg">{price}</Price>
            </div>

            {fieldErrorCount > 0 ? (
              <p role="alert" className="mt-5 text-sm text-bronze">
                {t("errors.invalid")}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              block
              disabled={pending}
              className="mt-5"
            >
              {pending ? (
                <>
                  <SpinnerIcon />
                  {t("submitting")}
                </>
              ) : (
                <>
                  <LockIcon />
                  {t("submit")}
                </>
              )}
            </Button>
            <p className="mt-3 text-xs leading-6 text-ink-subtle">
              {t("chargeNote")}
            </p>
          </div>
        </div>
      </aside>
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
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-2 block min-h-12 w-full rounded-panel border bg-parchment px-3.5 text-base text-ink transition duration-200 placeholder:text-ink-subtle focus:border-bronze ${
          error ? "border-bronze" : "border-line"
        }`}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-bronze">
          {error}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import {useActionState, useEffect, useState, type FormEvent} from "react";
import {useTranslations} from "next-intl";

import {createBookingAction} from "@/features/bookings/actions";
import {unscheduledCourseDateId} from "@/features/bookings/booking-date";
import {dateOfBirthBounds} from "@/features/bookings/date-of-birth";
import {
  bookingIssueLabelKeys,
  focusBookingIssue,
  localizeBookingFormErrors,
  visibleBookingIssueKeys,
  type BookingFormIssueKey,
} from "@/features/bookings/form-errors";
import {
  bookingSessionDraftFromFormData,
  hasBookingContactPrefill,
  pickFilled,
  readBookingFormDraft,
  readLastBookingContact,
  writeBookingFormDraft,
  type BookingContactPrefill,
  type BookingSessionDraft,
} from "@/features/bookings/form-draft";
import {parseBookingForm, type BookingFormErrors} from "@/features/bookings/validation";
import {formatCourseDateRange} from "@/features/courses/dates";
import {formatCataloguePrice} from "@/features/courses/price";
import {isComplimentaryCourse, type Course, type CourseDate} from "@/features/courses/types";
import type {AppLocale} from "@/i18n/routing";
import {Button} from "@/shared/ui/button";
import {DateField} from "@/shared/ui/date-field";
import {shiftIsoYears, todayIsoInZurich} from "@/shared/ui/date-field-calendar";
import {fieldStyles} from "@/shared/ui/field";
import {CheckIcon, LockIcon, SpinnerIcon} from "@/shared/ui/icons";
import {LegalDocLink} from "@/shared/ui/legal-doc-link";
import {Price} from "@/shared/ui/price";
import {useHydrated} from "@/shared/use-hydrated";

type BookingFormProps = {
  locale: AppLocale;
  course: Course;
  dates: CourseDate[];
  initialDateId?: string;
  defaults?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    dateOfBirth?: string;
  };
};

export function BookingForm(props: BookingFormProps) {
  const hydrated = useHydrated();
  const sessionDraft = hydrated ? readBookingFormDraft(props.course.id) : null;
  const lastContact = hydrated ? readLastBookingContact() : null;

  return (
    <BookingFormFields
      key={sessionDraft || hasBookingContactPrefill(lastContact) ? "restored" : "live"}
      {...props}
      sessionDraft={sessionDraft}
      lastContact={lastContact}
    />
  );
}

function BookingFormFields({
  locale,
  course,
  dates,
  initialDateId,
  defaults,
  sessionDraft,
  lastContact,
}: BookingFormProps & {
  sessionDraft: BookingSessionDraft | null;
  lastContact: BookingContactPrefill | null;
}) {
  const t = useTranslations("BookingForm");
  const [state, formAction, pending] = useActionState(
    createBookingAction.bind(null, locale, course.id),
    null,
  );
  const [clientErrors, setClientErrors] = useState<BookingFormErrors | null>(
    null,
  );
  const errors = clientErrors ?? state?.errors;
  const draft = state?.draft;
  const schedulePending = dates.length === 0;
  const pendingDateId = unscheduledCourseDateId(course.id);
  const [selectedDateId, setSelectedDateId] = useState(() => {
    if (schedulePending) {
      return pendingDateId;
    }
    if (
      sessionDraft?.courseDateId &&
      dates.some((date) => date.id === sessionDraft.courseDateId)
    ) {
      return sessionDraft.courseDateId;
    }
    if (initialDateId && dates.some((date) => date.id === initialDateId)) {
      return initialDateId;
    }
    return dates.length === 1 ? dates[0].id : "";
  });
  const [pendingIntent, setPendingIntent] = useState<"checkout" | "lead" | null>(
    null,
  );

  const selectedDate = dates.find((date) => date.id === selectedDateId);
  const complimentary = isComplimentaryCourse(course);
  const price = formatCataloguePrice(course.priceChf, locale);
  const missingKeys = errors ? visibleBookingIssueKeys(errors) : [];
  const missingSignature = missingKeys.join(",");
  const birthBounds = dateOfBirthBounds();
  const birthView = shiftIsoYears(todayIsoInZurich(), -30);

  useEffect(() => {
    if (!missingSignature) {
      return;
    }

    const firstKey = missingSignature.split(",")[0];
    if (firstKey) {
      focusBookingIssue(firstKey as (typeof missingKeys)[number]);
    }
  }, [missingSignature]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const submitter = "submitter" in event.nativeEvent
      ? (event.nativeEvent as SubmitEvent).submitter
      : null;

    if (submitter instanceof HTMLButtonElement && submitter.name === "intent") {
      formData.set("intent", submitter.value);
    }

    const parsed = parseBookingForm(formData);

    if (parsed.errors) {
      event.preventDefault();
      setPendingIntent(null);
      setClientErrors(
        localizeBookingFormErrors(parsed.errors, (key) =>
          t(`errors.${key}` as "errors.invalid"),
        ),
      );
      return;
    }

    setClientErrors(null);
  }

  function persistDraft(form: HTMLFormElement) {
    writeBookingFormDraft(
      course.id,
      bookingSessionDraftFromFormData(new FormData(form)),
    );
  }

  const firstName = pickFilled(
    draft?.firstName,
    sessionDraft?.firstName,
    defaults?.firstName,
    lastContact?.firstName,
  );
  const lastName = pickFilled(
    draft?.lastName,
    sessionDraft?.lastName,
    defaults?.lastName,
    lastContact?.lastName,
  );
  const dateOfBirth = pickFilled(
    draft?.dateOfBirth,
    sessionDraft?.dateOfBirth,
    defaults?.dateOfBirth,
    lastContact?.dateOfBirth,
  );
  const email = pickFilled(draft?.email, sessionDraft?.email, defaults?.email, lastContact?.email);
  const phone = pickFilled(draft?.phone, sessionDraft?.phone, defaults?.phone, lastContact?.phone);
  const street = pickFilled(
    draft?.street,
    sessionDraft?.street,
    defaults?.street,
    lastContact?.street,
  );
  const postalCode = pickFilled(
    draft?.postalCode,
    sessionDraft?.postalCode,
    defaults?.postalCode,
    lastContact?.postalCode,
  );
  const city = pickFilled(draft?.city, sessionDraft?.city, defaults?.city, lastContact?.city);
  const country =
    pickFilled(
      draft?.country,
      sessionDraft?.country,
      defaults?.country,
      lastContact?.country,
    ) ?? t("countryDefault");

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      onInput={(event) => persistDraft(event.currentTarget)}
      onChange={(event) => persistDraft(event.currentTarget)}
      aria-busy={pending}
      noValidate
      className="grid gap-10 lg:grid-cols-12 lg:gap-16"
    >
      <div className="space-y-8 lg:col-span-7">
        {errors?.form || missingKeys.length > 0 ? (
          <MissingFields
            intro={t("errors.missingIntro")}
            issues={missingKeys.map((key) => ({
              key,
              label: t(bookingIssueLabelKeys[key]),
            }))}
            formError={errors?.form}
          />
        ) : null}

        {schedulePending ? (
          <div className="border border-ink bg-white p-5">
            <input type="hidden" name="courseDateId" value={pendingDateId} />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">
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
          <fieldset id="booking-date" tabIndex={-1} className="scroll-mt-24">
            <legend className="font-serif text-subheading">
              {t("dateLabel")}
            </legend>
            <p className="mt-2 text-sm text-ink-muted">{t("dateHelp")}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {dates.map((date) => {
                const isSelected = date.id === selectedDateId;

                return (
                  <label
                    key={date.id}
                    className={`flex min-h-24 cursor-pointer flex-col justify-between gap-3 rounded-panel border p-4 transition duration-150 ease-standard has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
                      isSelected
                        ? "border-ink bg-hover"
                        : "border-line bg-white hover:border-ink"
                    }`}
                  >
                    <input
                      type="radio"
                      name="courseDateId"
                      value={date.id}
                      checked={isSelected}
                      onChange={(event) => {
                        setSelectedDateId(date.id);
                        const form = event.currentTarget.form;
                        if (form) {
                          persistDraft(form);
                        }
                      }}
                      className="sr-only"
                    />
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-medium">
                        {formatCourseDateRange(date, locale)}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border ${
                          isSelected ? "border-ink bg-ink text-parchment" : "border-line bg-white"
                        }`}
                      >
                        {isSelected ? <CheckIcon className="h-3 w-3" /> : null}
                      </span>
                    </span>
                    <span className="flex items-end justify-between gap-3 text-sm text-ink-muted">
                      <span>{date.location[locale]}</span>
                      <Price size="sm">{price}</Price>
                    </span>
                  </label>
                );
              })}
            </div>
            {errors?.courseDateId ? (
              <p role="alert" className="mt-2 text-sm text-ink">
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
            defaultValue={firstName}
          />
          <Field
            name="lastName"
            autoComplete="family-name"
            label={t("lastName")}
            error={errors?.lastName}
            defaultValue={lastName}
          />
          <DateField
            id="dateOfBirth"
            name="dateOfBirth"
            label={t("dateOfBirth")}
            error={errors?.dateOfBirth}
            required
            min={birthBounds.min}
            max={birthBounds.max}
            defaultValue={dateOfBirth}
            initialView={birthView}
            fieldClassName="sm:col-span-2"
          />
          <Field
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            label={t("email")}
            error={errors?.email}
            defaultValue={email}
          />
          <Field
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            label={t("phone")}
            error={errors?.phone}
            defaultValue={phone}
          />
          <Field
            name="street"
            autoComplete="street-address"
            label={t("street")}
            error={errors?.street}
            defaultValue={street}
            className="sm:col-span-2"
          />
          <Field
            name="postalCode"
            autoComplete="postal-code"
            label={t("postalCode")}
            error={errors?.postalCode}
            defaultValue={postalCode}
          />
          <Field
            name="city"
            autoComplete="address-level2"
            label={t("city")}
            error={errors?.city}
            defaultValue={city}
          />
          <Field
            name="country"
            autoComplete="country-name"
            label={t("country")}
            error={errors?.country}
            defaultValue={country}
            className="sm:col-span-2"
          />
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3 rounded-panel border border-line bg-parchment/60 p-4 text-sm leading-6 transition duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink">
            <input
              id="privacyAccepted"
              type="checkbox"
              name="privacyAccepted"
              required
              defaultChecked={sessionDraft?.privacyAccepted}
              aria-invalid={errors?.privacyAccepted ? true : undefined}
              className="mt-0.5 h-5 w-5 shrink-0"
            />
            <span className="text-ink-muted">
              {t.rich("privacy", {
                privacy: (chunks) => (
                  <LegalDocLink
                    href="/legal/privacy"
                    className="text-ink underline underline-offset-2"
                  >
                    {chunks}
                  </LegalDocLink>
                ),
                terms: (chunks) => (
                  <LegalDocLink
                    href="/legal/terms"
                    className="text-ink underline underline-offset-2"
                  >
                    {chunks}
                  </LegalDocLink>
                ),
              })}
            </span>
          </label>
          {errors?.privacyAccepted ? (
            <p role="alert" className="mt-2 text-sm text-ink">
              {errors.privacyAccepted}
            </p>
          ) : null}
        </div>
      </div>

      <aside className="lg:col-span-5">
        <div className="lg:sticky lg:top-24">
          <div className="rounded-panel border border-line bg-parchment p-6">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold-deep">
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
                      : t("dateUnset")}
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

            {errors?.form || missingKeys.length > 0 ? (
              <div className="mt-5">
                <MissingFields
                  intro={t("errors.missingIntro")}
                  issues={missingKeys.map((key) => ({
                    key,
                    label: t(bookingIssueLabelKeys[key]),
                  }))}
                  formError={errors?.form}
                  duplicate
                />
              </div>
            ) : null}

            <Button
              type="submit"
              name="intent"
              value="checkout"
              size="lg"
              block
              disabled={pending}
              className="mt-5"
              onClick={() => setPendingIntent("checkout")}
            >
              {pending && pendingIntent === "checkout" ? (
                <>
                  <SpinnerIcon />
                  {complimentary ? t("submittingFree") : t("submitting")}
                </>
              ) : (
                <>
                  {complimentary ? null : <LockIcon />}
                  {complimentary ? t("submitFree") : t("submit")}
                </>
              )}
            </Button>
            {complimentary ? (
              <p className="mt-3 text-xs leading-6 text-ink-subtle">
                {t("freeNote")}
              </p>
            ) : (
              <>
                <Button
                  type="submit"
                  name="intent"
                  value="lead"
                  variant="secondary"
                  size="lg"
                  block
                  disabled={pending}
                  className="mt-3"
                  onClick={() => setPendingIntent("lead")}
                >
                  {pending && pendingIntent === "lead" ? (
                    <>
                      <SpinnerIcon />
                      {t("submittingLead")}
                    </>
                  ) : (
                    t("submitLead")
                  )}
                </Button>
                <p className="mt-3 text-xs leading-6 text-ink-subtle">
                  {t("chargeNote")}
                </p>
              </>
            )}
          </div>
        </div>
      </aside>
    </form>
  );
}

function MissingFields({
  intro,
  issues,
  formError,
  duplicate = false,
}: {
  intro: string;
  issues: {key: BookingFormIssueKey; label: string}[];
  formError?: string;
  duplicate?: boolean;
}) {
  return (
    <div
      role={duplicate ? undefined : "alert"}
      aria-hidden={duplicate || undefined}
      className="rounded-panel border border-ink bg-white px-4 py-3 text-sm text-ink"
    >
      {formError ? <p>{formError}</p> : null}
      {issues.length > 0 ? (
        <>
          <p className={formError ? "mt-2 font-medium" : "font-medium"}>{intro}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {issues.map((issue) => (
              <li key={issue.key}>
                <button
                  type="button"
                  className="text-left underline underline-offset-2 transition-opacity duration-150 hover:opacity-60"
                  onClick={() => focusBookingIssue(issue.key)}
                >
                  {issue.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
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
  className = "",
}: {
  name: string;
  label: string;
  error?: string;
  type?: string;
  inputMode?: "email" | "tel" | "text";
  autoComplete?: string;
  defaultValue?: string;
  className?: string;
}) {
  const errorId = `${name}-error`;

  return (
    <div className={className}>
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
        className={`mt-2 ${fieldStyles({invalid: Boolean(error)})} bg-parchment placeholder:text-ink-subtle`}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}

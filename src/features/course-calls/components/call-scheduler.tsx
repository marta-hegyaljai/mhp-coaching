"use client";

import {useActionState, useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import {scheduleCourseCallAction} from "@/features/course-calls/actions";
import {MonthCalendar} from "@/features/course-calls/components/month-calendar";
import {parseIsoDate} from "@/shared/ui/date-field-calendar";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {InputField, TextareaField} from "@/shared/ui/field";
import {SubmitButton} from "@/shared/ui/submit-button";

export function CallScheduler({
  locale,
  courseId,
  courseSlug,
  selectedDate,
  availableDates,
  slotsByDate,
  minDate,
  maxDate,
  defaults,
}: {
  locale: AppLocale;
  courseId: string;
  courseSlug: string;
  selectedDate: string;
  availableDates: string[];
  slotsByDate: Record<string, Array<{time: string; label: string}>>;
  minDate: string;
  maxDate: string;
  defaults?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}) {
  const t = useTranslations("CourseAdvice");
  const available = useMemo(() => new Set(availableDates), [availableDates]);
  const parsed = parseIsoDate(selectedDate) ?? parseIsoDate(minDate);
  const [cursor, setCursor] = useState({
    year: parsed?.year ?? 2026,
    month: parsed?.month ?? 0,
  });
  const [date, setDate] = useState(selectedDate);
  const [time, setTime] = useState("");
  const [state, formAction, pending] = useActionState(
    scheduleCourseCallAction.bind(null, locale, courseId),
    null,
  );

  if (state?.ok) {
    return (
      <p role="status" className="border border-ink bg-white px-5 py-6 text-sm leading-7 text-ink">
        {t("callSuccess")}
      </p>
    );
  }

  const errors = state?.errors;
  const draft = state?.draft;
  const activeDate = draft?.date && available.has(draft.date) ? draft.date : date;
  const slots = slotsByDate[activeDate] ?? [];
  const selectedTime =
    draft?.time && slots.some((slot) => slot.time === draft.time) ? draft.time : time;
  const selectedSlot = slots.find((slot) => slot.time === selectedTime);

  return (
    <form action={formAction} noValidate className="space-y-10" aria-busy={pending}>
      <input type="hidden" name="date" value={draft?.date || activeDate} />
      <input type="hidden" name="time" value={selectedTime} />
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">{t("company")}</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      {errors?.form ? (
        <p role="alert" className="border border-ink px-4 py-3 text-sm text-ink">
          {errors.form}
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
        <div className="lg:col-span-5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold">
            {t("dateEyebrow")}
          </p>
          <h2 className="mt-2 font-serif text-subheading">{t("dateTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">{t("dateHelp")}</p>
          <div className="mt-5">
            <MonthCalendar
              selected={activeDate}
              availableDates={available}
              min={minDate}
              max={maxDate}
              cursor={cursor}
              onMonthChange={setCursor}
              onSelect={(iso) => {
                setTime("");
                setDate(iso);
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-7">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold">
            {t("slotEyebrow")}
          </p>
          <h2 className="mt-2 font-serif text-subheading">{t("slotTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">{t("slotHelp")}</p>
          {slots.length === 0 ? (
            <p className="mt-5 border border-line bg-white px-4 py-5 text-sm leading-7 text-ink-muted">
              {available.size === 0 ? t("noHours") : t("noSlots")}{" "}
              <Link
                href={{
                  pathname: "/courses/[slug]/advice",
                  params: {slug: courseSlug},
                  query: {mode: "write"},
                }}
                className="font-medium text-ink underline underline-offset-4"
              >
                {t("writeInstead")}
              </Link>
            </p>
          ) : (
            <div
              role="radiogroup"
              aria-label={t("slotTitle")}
              className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3"
            >
              {slots.map((slot) => {
                const selected = slot.time === selectedTime;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setTime(slot.time)}
                    className={`flex min-h-11 items-center justify-center rounded-panel border font-sans text-sm tabular-nums transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                      selected
                        ? "border-ink bg-ink text-parchment"
                        : "border-line bg-white text-ink hover:bg-hover"
                    }`}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          )}
          {errors?.date || errors?.time || errors?.slot ? (
            <p role="alert" className="mt-3 text-sm text-ink">
              {errors.slot ?? errors.time ?? errors.date}
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-line pt-10">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold">
          {t("detailsEyebrow")}
        </p>
        <h2 className="mt-2 font-serif text-subheading">{t("detailsTitle")}</h2>
        {selectedSlot ? (
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            {t("selectedSummary", {time: selectedSlot.label})}
          </p>
        ) : (
          <p className="mt-2 text-sm leading-6 text-ink-muted">{t("detailsHelp")}</p>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
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

        <div className="mt-5">
          <TextareaField
            id="message"
            name="message"
            label={t("messageOptional")}
            rows={4}
            defaultValue={draft?.message}
            error={errors?.message}
          />
        </div>

        <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-ink-muted">
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
            })}
          </span>
        </label>
        {errors?.privacyAccepted ? (
          <p role="alert" className="mt-2 text-sm text-ink">
            {errors.privacyAccepted}
          </p>
        ) : null}

        <div className="mt-6">
          <SubmitButton
            pending={pending}
            label={t("submitCall")}
            pendingLabel={t("submitting")}
            disabled={!selectedTime}
          />
        </div>
      </div>
    </form>
  );
}

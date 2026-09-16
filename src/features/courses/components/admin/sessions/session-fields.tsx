"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";

import {LocalizedFields} from "@/features/courses/components/admin/localized-fields";
import {
  SESSION_AVAILABILITIES,
  sessionAvailabilityOf,
  type CourseDate,
  type LocalizedText,
} from "@/features/courses/types";
import type {AppLocale} from "@/i18n/routing";
import {ChevronDownIcon} from "@/shared/ui/icons";
import {DateField} from "@/shared/ui/date-field";
import {fieldLabelClass, fieldStyles, InputField} from "@/shared/ui/field";

const EMPTY_TEXT: LocalizedText = {fr: "", de: "", en: ""};

export function placeSummary(
  location: LocalizedText,
  venue: LocalizedText | undefined,
  locale: AppLocale,
  fallback: string,
): string {
  const parts = [location[locale]?.trim(), venue?.[locale]?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : fallback;
}

/**
 * The fields shared by editing and creating a session. Dates and capacity are
 * the daily edit and stay in view; the nine localized place inputs sit behind
 * a disclosure so one open session still fits on a phone screen.
 */
export function SessionFields({
  idPrefix,
  date,
  fallbackLocation,
  locale,
  revealPlace = false,
}: {
  /** Keeps control ids unique while several session forms share a page. */
  idPrefix: string;
  date?: CourseDate;
  /** Used when a new session inherits the course location. */
  fallbackLocation: LocalizedText;
  locale: AppLocale;
  /** Opens the place group when the server rejected a localized value. */
  revealPlace?: boolean;
}) {
  const t = useTranslations("Admin");
  const [placeOpen, setPlaceOpen] = useState(false);
  const [revealed, setRevealed] = useState(revealPlace);
  const location = date?.location ?? fallbackLocation;
  const venue = date?.venue;
  const placeId = `${idPrefix}-place`;

  // A rejected submit reveals the group once; the admin may close it again.
  if (revealPlace !== revealed) {
    setRevealed(revealPlace);
    if (revealPlace) {
      setPlaceOpen(true);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7rem]">
        <DateField
          id={`${idPrefix}-start`}
          name="startDate"
          label={t("coursesStartDate")}
          size="sm"
          required
          defaultValue={date?.startDate ?? ""}
        />
        <DateField
          id={`${idPrefix}-end`}
          name="endDate"
          label={t("coursesEndDate")}
          size="sm"
          defaultValue={date?.endDate ?? date?.startDate ?? ""}
        />
        <InputField
          id={`${idPrefix}-capacity`}
          name="capacity"
          label={t("coursesCapacity")}
          type="number"
          size="sm"
          numeric
          required
          min={1}
          step={1}
          defaultValue={String(date?.capacity ?? 16)}
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-availability`} className={fieldLabelClass}>
          {t("coursesSessionAvailability")}
        </label>
        <select
          id={`${idPrefix}-availability`}
          name="availability"
          defaultValue={sessionAvailabilityOf(date ?? {})}
          className={`mt-2 ${fieldStyles({size: "sm"})}`}
        >
          {SESSION_AVAILABILITIES.map((option) => (
            <option key={option} value={option}>
              {t(`coursesSessionAvailability_${option}`)}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs leading-5 text-ink-subtle">
          {t("coursesSessionAvailabilityHelp")}
        </p>
      </div>

      <div className="rounded-panel border border-line bg-white">
        <button
          type="button"
          onClick={() => setPlaceOpen((open) => !open)}
          aria-expanded={placeOpen}
          aria-controls={placeId}
          className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-panel px-3 py-2 text-left transition-colors duration-150 ease-standard hover:bg-hover"
        >
          <span className="min-w-0">
            <span className="block text-sm font-medium text-ink">{t("coursesSessionPlace")}</span>
            <span className="block truncate text-xs text-ink-subtle">
              {placeSummary(location, venue, locale, t("coursesSessionVenueNone"))}
            </span>
          </span>
          <ChevronDownIcon
            className={`text-ink-subtle transition-transform duration-150 ease-standard ${
              placeOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {/* The inputs stay mounted so a collapsed group never drops an edit.
            They are optional in HTML because a hidden required control blocks
            submission silently; the server action validates them. */}
        <div
          id={placeId}
          hidden={!placeOpen}
          className="space-y-4 border-t border-line px-3 py-4"
        >
          <LocalizedFields
            name="location"
            idPrefix={`${idPrefix}-location`}
            label={t("coursesLocationField")}
            values={location}
            layout="inline"
            size="sm"
            required={false}
          />
          <LocalizedFields
            name="venue"
            idPrefix={`${idPrefix}-venue`}
            label={t("coursesVenueField")}
            values={venue ?? EMPTY_TEXT}
            layout="inline"
            size="sm"
            required={false}
          />
        </div>
      </div>
    </div>
  );
}

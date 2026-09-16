"use client";

import {useActionState, useState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert, AuthField, AuthNotice} from "@/features/auth/components/auth-field";
import {
  updateCourseAction,
} from "@/features/courses/admin";
import {LocalizedFields} from "@/features/courses/components/admin/localized-fields";
import {ProgrammeModulesField} from "@/features/courses/components/admin/programme-modules-field";
import {programmeModuleIds} from "@/features/courses/programme";
import {
  COURSE_AVAILABILITIES,
  COURSE_FORMATS,
  COURSE_CATEGORIES,
  courseAvailabilityOf,
  courseFormatOf,
  type Course,
  type CourseCategory,
  type CourseFormat,
} from "@/features/courses/types";
import type {AppLocale} from "@/i18n/routing";
import {fieldLabelClass, fieldStyles} from "@/shared/ui/field";
import {SubmitButton} from "@/shared/ui/submit-button";

const CATEGORIES: CourseCategory[] = [...COURSE_CATEGORIES];

export function AdminCourseForm({
  course,
  modules,
  locale,
}: {
  course: Course;
  /** Modules selectable as programme contents, in catalogue order. */
  modules: Course[];
  locale: AppLocale;
}) {
  const t = useTranslations("Admin");
  const [format, setFormat] = useState<CourseFormat>(courseFormatOf(course));
  const [state, action, pending] = useActionState(
    updateCourseAction,
    null,
  );

  return (
    <form action={action} className="space-y-6 rounded-panel border border-ink bg-white p-5 sm:p-6">
      <input type="hidden" name="courseId" value={course.id} />
      {state?.error ? <AuthAlert>{t(`coursesErrors.${state.error}`)}</AuthAlert> : null}
      {state?.success === "saved" ? <AuthNotice>{t("coursesSaved")}</AuthNotice> : null}

      <LocalizedFields name="title" label={t("coursesTitleField")} values={course.title} />
      <LocalizedFields name="slug" label={t("coursesSlugField")} values={course.slug} />
      <LocalizedFields
        name="shortDescription"
        label={t("coursesSummaryField")}
        values={course.shortDescription}
        multiline
      />
      <LocalizedFields
        name="description"
        label={t("coursesDescriptionField")}
        values={course.description}
        multiline
      />
      <LocalizedFields
        name="audience"
        label={t("coursesAudienceField")}
        values={course.audience}
        multiline
      />
      <LocalizedFields name="duration" label={t("coursesDurationField")} values={course.duration} />
      <LocalizedFields name="location" label={t("coursesLocationField")} values={course.location} />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="format" className={fieldLabelClass}>
            {t("coursesFormat")}
          </label>
          <select
            id="format"
            name="format"
            value={format}
            onChange={(event) => setFormat(event.target.value as CourseFormat)}
            className={`mt-2 ${fieldStyles()}`}
          >
            {COURSE_FORMATS.map((option) => (
              <option key={option} value={option}>
                {t(`coursesFormat_${option}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="category" className={fieldLabelClass}>
            {t("coursesCategory")}
          </label>
          <select
            id="category"
            name="category"
            defaultValue={course.category}
            className={`mt-2 ${fieldStyles()}`}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {t(`coursesCategory_${category}`)}
              </option>
            ))}
          </select>
        </div>
        <AuthField
          name="priceChf"
          label={t("coursesPrice")}
          type="number"
          defaultValue={String(course.priceChf)}
        />
        <label className="flex min-h-12 items-end gap-3 pb-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            name="published"
            defaultChecked={course.published !== false}
            className="size-4 accent-ink"
          />
          {t("coursesPublished")}
        </label>
      </div>

      <div>
        <label htmlFor="availability" className={fieldLabelClass}>
          {t("coursesAvailability")}
        </label>
        <select
          id="availability"
          name="availability"
          defaultValue={courseAvailabilityOf(course)}
          className={`mt-2 ${fieldStyles()}`}
        >
          {COURSE_AVAILABILITIES.map((option) => (
            <option key={option} value={option}>
              {t(`coursesAvailability_${option}`)}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs leading-5 text-ink-subtle">{t("coursesAvailabilityHelp")}</p>
      </div>

      {format === "programme" ? (
        <ProgrammeModulesField
          modules={modules}
          selectedIds={programmeModuleIds(course)}
          locale={locale}
          labels={{
            label: t("coursesProgrammeModules"),
            hint: t("coursesProgrammeModulesHint"),
            empty: t("coursesProgrammeModulesEmpty"),
          }}
        />
      ) : null}

      <SubmitButton
        pending={pending}
        label={t("coursesSave")}
        pendingLabel={t("coursesSaving")}
      />
    </form>
  );
}

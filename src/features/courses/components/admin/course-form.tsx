"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert, AuthField, AuthNotice} from "@/features/auth/components/auth-field";
import {
  updateCourseAction,
} from "@/features/courses/admin";
import {LocalizedFields} from "@/features/courses/components/admin/localized-fields";
import type {Course, CourseCategory} from "@/features/courses/types";
import {fieldLabelClass, fieldStyles} from "@/shared/ui/field";
import {SubmitButton} from "@/shared/ui/submit-button";

const CATEGORIES: CourseCategory[] = ["foundation", "advanced", "medical", "workshop"];

export function AdminCourseForm({course}: {course: Course}) {
  const t = useTranslations("Admin");
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
        <AuthField
          name="displayOrder"
          label={t("coursesDisplayOrder")}
          type="number"
          defaultValue={String(course.displayOrder ?? 0)}
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

      <SubmitButton
        pending={pending}
        label={t("coursesSave")}
        pendingLabel={t("coursesSaving")}
      />
    </form>
  );
}

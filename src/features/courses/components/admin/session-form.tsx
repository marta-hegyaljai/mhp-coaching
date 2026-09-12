"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert, AuthField, AuthNotice} from "@/features/auth/components/auth-field";
import {
  createCourseSessionAction,
  updateCourseSessionAction,
} from "@/features/courses/admin";
import {LocalizedFields} from "@/features/courses/components/admin/localized-fields";
import type {Course, CourseDate} from "@/features/courses/types";
import {StatusLabel} from "@/shared/ui/status-label";
import {SubmitButton} from "@/shared/ui/submit-button";

const emptyVenue = {fr: "", de: "", en: ""};

function SessionFields({
  date,
  location,
}: {
  date?: CourseDate;
  location: Course["location"];
}) {
  const t = useTranslations("Admin");

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-3">
        <AuthField
          name="startDate"
          label={t("coursesStartDate")}
          type="date"
          defaultValue={date?.startDate}
        />
        <AuthField
          name="endDate"
          label={t("coursesEndDate")}
          type="date"
          defaultValue={date?.endDate ?? date?.startDate}
          required={false}
        />
        <AuthField
          name="capacity"
          label={t("coursesCapacity")}
          type="number"
          defaultValue={String(date?.capacity ?? 16)}
        />
      </div>
      <LocalizedFields
        name="location"
        label={t("coursesLocationField")}
        values={date?.location ?? location}
      />
      <LocalizedFields
        name="venue"
        label={t("coursesVenueField")}
        values={date?.venue ?? emptyVenue}
        required={false}
      />
    </>
  );
}

export function AdminSessionForm({
  courseId,
  date,
  enrolmentCount,
}: {
  courseId: string;
  date: CourseDate;
  enrolmentCount: number;
}) {
  const t = useTranslations("Admin");
  const [state, action, pending] = useActionState(
    updateCourseSessionAction,
    null,
  );

  return (
    <form action={action} className="space-y-5 rounded-panel border border-ink bg-white p-5">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="sessionId" value={date.id} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusLabel tone={date.active ? "strong" : "muted"}>
          {date.active ? t("coursesSessionActive") : t("coursesSessionInactive")}
        </StatusLabel>
        <p className="font-sans text-xs font-semibold tabular-nums text-ink-muted">
          {t("coursesEnrolmentCount", {count: enrolmentCount})}
        </p>
      </div>
      {state?.error ? <AuthAlert>{t(`coursesErrors.${state.error}`)}</AuthAlert> : null}
      {state?.success === "session" ? <AuthNotice>{t("coursesSessionSaved")}</AuthNotice> : null}
      <SessionFields date={date} location={date.location} />
      <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-ink">
        <input
          type="checkbox"
          name="active"
          defaultChecked={date.active}
          className="size-4 accent-ink"
        />
        {t("coursesSessionKeepActive")}
      </label>
      <p className="text-sm leading-6 text-ink-muted">{t("coursesSessionDeactivateHelp")}</p>
      <SubmitButton
        pending={pending}
        label={t("coursesSaveSession")}
        pendingLabel={t("coursesSaving")}
      />
    </form>
  );
}

export function AdminCreateSessionForm({course}: {course: Course}) {
  const t = useTranslations("Admin");
  const [state, action, pending] = useActionState(
    createCourseSessionAction,
    null,
  );

  return (
    <form action={action} className="space-y-5 rounded-panel border border-ink bg-white p-5">
      <input type="hidden" name="courseId" value={course.id} />
      <input type="hidden" name="active" value="on" />
      <h3 className="font-serif text-subheading">{t("coursesAddSession")}</h3>
      <p className="text-sm leading-6 text-ink-muted">{t("coursesAddSessionHelp")}</p>
      {state?.error ? <AuthAlert>{t(`coursesErrors.${state.error}`)}</AuthAlert> : null}
      {state?.success === "created" ? <AuthNotice>{t("coursesSessionCreated")}</AuthNotice> : null}
      <SessionFields location={course.location} />
      <SubmitButton
        pending={pending}
        label={t("coursesCreateSession")}
        pendingLabel={t("coursesSaving")}
      />
    </form>
  );
}

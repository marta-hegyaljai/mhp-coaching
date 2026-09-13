"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert, AuthNotice} from "@/features/auth/components/auth-field";
import {createCourseSessionAction} from "@/features/courses/admin";
import type {Course} from "@/features/courses/types";
import type {AppLocale} from "@/i18n/routing";
import {CloseIcon} from "@/shared/ui/icons";
import {SectionLabel} from "@/shared/ui/section-label";
import {SubmitButton} from "@/shared/ui/submit-button";

import {SessionFields} from "./session-fields";

/** New sessions inherit the course location and open for enrolment. */
export function CreateSessionPanel({
  course,
  locale,
  id,
  onClose,
}: {
  course: Course;
  locale: AppLocale;
  id: string;
  onClose: () => void;
}) {
  const t = useTranslations("Admin");
  const [state, action, pending] = useActionState(createCourseSessionAction, null);

  return (
    <form
      id={id}
      action={action}
      className="space-y-4 rounded-panel border border-ink bg-shell p-4 sm:p-5"
    >
      <input type="hidden" name="courseId" value={course.id} />
      <input type="hidden" name="active" value="on" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <SectionLabel>{t("coursesAddSession")}</SectionLabel>
          <p className="mt-1 text-xs leading-5 text-ink-subtle">{t("coursesAddSessionHelp")}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("coursesSessionClose")}
          className="-my-2 -mr-2 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-panel text-ink transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <CloseIcon />
        </button>
      </div>

      {state?.error ? <AuthAlert>{t(`coursesErrors.${state.error}`)}</AuthAlert> : null}
      {state?.success === "created" ? <AuthNotice>{t("coursesSessionCreated")}</AuthNotice> : null}

      <SessionFields
        idPrefix="session-new"
        fallbackLocation={course.location}
        locale={locale}
        revealPlace={state?.error === "localized"}
      />

      <SubmitButton
        pending={pending}
        label={t("coursesCreateSession")}
        pendingLabel={t("coursesSaving")}
      />
    </form>
  );
}

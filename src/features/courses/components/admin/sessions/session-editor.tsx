"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert, AuthNotice} from "@/features/auth/components/auth-field";
import {updateCourseSessionAction} from "@/features/courses/admin";
import type {AppLocale} from "@/i18n/routing";
import {Button} from "@/shared/ui/button";
import {SubmitButton} from "@/shared/ui/submit-button";

import type {SessionEntry} from "./model";
import {SessionFields} from "./session-fields";

/**
 * The expanded row body. It mounts only while its row is open, so the page
 * never carries a dozen full forms at once.
 */
export function SessionEditor({
  courseId,
  entry,
  locale,
  onClose,
}: {
  courseId: string;
  entry: SessionEntry;
  locale: AppLocale;
  onClose: () => void;
}) {
  const t = useTranslations("Admin");
  const [state, action, pending] = useActionState(updateCourseSessionAction, null);

  return (
    <form
      action={action}
      className="space-y-4 border-t border-line bg-shell px-4 py-4 sm:px-5"
    >
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="sessionId" value={entry.date.id} />

      {state?.error ? <AuthAlert>{t(`coursesErrors.${state.error}`)}</AuthAlert> : null}
      {state?.success === "session" ? (
        <AuthNotice>{t("coursesSessionSaved")}</AuthNotice>
      ) : null}

      <SessionFields
        idPrefix={`session-${entry.date.id}`}
        date={entry.date}
        fallbackLocation={entry.date.location}
        locale={locale}
        revealPlace={state?.error === "localized"}
      />

      <div>
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-ink">
          <input
            type="checkbox"
            name="active"
            defaultChecked={entry.date.active}
            className="size-4 accent-ink"
          />
          {t("coursesSessionKeepActive")}
        </label>
        <p className="text-xs leading-5 text-ink-subtle">
          {t("coursesSessionDeactivateHelp")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton
          pending={pending}
          label={t("coursesSaveSession")}
          pendingLabel={t("coursesSaving")}
        />
        <Button type="button" variant="secondary" onClick={onClose}>
          {t("coursesSessionClose")}
        </Button>
      </div>
    </form>
  );
}

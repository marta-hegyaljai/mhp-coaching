"use client";

import {useActionState, useState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert, AuthNotice} from "@/features/auth/components/auth-field";
import {deleteCourseSessionAction} from "@/features/courses/admin";
import {Button} from "@/shared/ui/button";
import {SubmitButton} from "@/shared/ui/submit-button";

/**
 * Hard-delete lives beside deactivate: only empty sessions can be removed,
 * and the second click is the confirmation so a mis-tap cannot erase a date.
 */
export function SessionDelete({
  courseId,
  sessionId,
}: {
  courseId: string;
  sessionId: string;
}) {
  const t = useTranslations("Admin");
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(deleteCourseSessionAction, null);

  return (
    <form action={action} className="space-y-3 border-t border-line pt-4">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="sessionId" value={sessionId} />

      {state?.error ? <AuthAlert>{t(`coursesErrors.${state.error}`)}</AuthAlert> : null}
      {state?.success === "deleted" ? (
        <AuthNotice>{t("coursesSessionDeleted")}</AuthNotice>
      ) : null}

      {confirming ? (
        <>
          <p className="text-sm leading-6 text-ink-muted">
            {t("coursesSessionDeleteConfirmHelp")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton
              pending={pending}
              variant="secondary"
              label={t("coursesSessionDeleteConfirm")}
              pendingLabel={t("coursesSessionDeleting")}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              {t("coursesSessionClose")}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs leading-5 text-ink-subtle">{t("coursesSessionDeleteHelp")}</p>
          <Button type="button" variant="secondary" onClick={() => setConfirming(true)}>
            {t("coursesSessionDelete")}
          </Button>
        </>
      )}
    </form>
  );
}

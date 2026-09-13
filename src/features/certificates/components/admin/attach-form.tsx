"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert, AuthNotice} from "@/features/auth/components/auth-field";
import {attachCertificateAction} from "@/features/certificates/actions";
import {DateField} from "@/shared/ui/date-field";
import {fieldStyles} from "@/shared/ui/field";
import {SectionLabel} from "@/shared/ui/section-label";
import {SubmitButton} from "@/shared/ui/submit-button";

export type CourseOption = {
  id: string;
  title: string;
};

const controlClass = `mt-2 ${fieldStyles()}`;

export function AttachCertificateForm({
  locale,
  userId,
  courses,
}: {
  locale: string;
  userId: string;
  courses: CourseOption[];
}) {
  const t = useTranslations("Certificates");
  const [state, action, pending] = useActionState(
    attachCertificateAction.bind(null, locale, userId),
    null,
  );

  return (
    <section
      aria-label={t("attach")}
      className="rounded-panel border border-ink bg-white p-5 sm:p-6"
    >
      <SectionLabel>{t("attach")}</SectionLabel>

      <form action={action} className="mt-5 space-y-5">
        {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
        {state?.ok ? <AuthNotice>{t("attached")}</AuthNotice> : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="courseId" className="block text-sm font-medium text-ink">
              {t("course")}
            </label>
            <select
              id="courseId"
              name="courseId"
              required
              className={controlClass}
              defaultValue=""
            >
              <option value="" disabled>
                {t("coursePlaceholder")}
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <DateField
            id="issuedOn"
            name="issuedOn"
            label={t("issuedOn")}
            required
          />
        </div>

        <div>
          <label htmlFor="document" className="block text-sm font-medium text-ink">
            {t("pdf")}
          </label>
          <input
            id="document"
            name="document"
            type="file"
            accept="application/pdf,.pdf"
            required
            className="mt-2 block w-full text-sm text-ink file:mr-4 file:min-h-11 file:rounded-panel file:border file:border-ink file:bg-white file:px-4 file:font-semibold file:text-ink hover:file:bg-hover"
          />
          <p className="mt-2 text-sm leading-6 text-ink-muted">{t("pdfHelp")}</p>
        </div>

        <SubmitButton
          pending={pending}
          label={t("attach")}
          pendingLabel={t("attaching")}
        />
      </form>
    </section>
  );
}

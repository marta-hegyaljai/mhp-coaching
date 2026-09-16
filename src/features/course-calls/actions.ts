"use server";

import {getTranslations} from "next-intl/server";
import {hasLocale} from "next-intl";

import {persistCheckoutContact} from "@/features/auth/contact";
import {requireAdmin} from "@/features/auth/require";
import {getCurrentUser} from "@/features/auth/session";
import {loadPublishedCourseById} from "@/features/courses/live";
import {sendCourseCallConfirmation, sendCourseCallStaffNotification, sendCourseInquiryConfirmation, sendCourseInquiryStaffNotification} from "@/features/email/course-call";
import {localizedPath} from "@/features/seo/metadata";
import {routing, type AppLocale} from "@/i18n/routing";

import {saveCallHours} from "./admin";
import {scheduleCourseCall} from "./booking";
import {cancelCourseCall} from "./booking";
import {createCourseInquiry} from "./admin";
import {CourseCallError} from "./errors";
import {
  parseAdminHoursForm,
  parseCallForm,
  parseInquiryForm,
  readCallDraft,
  readInquiryDraft,
  type CallFormDraft,
  type CallFormErrors,
  type InquiryFormDraft,
  type InquiryFormErrors,
} from "./validation";

export type ScheduleCallState = {
  ok?: boolean;
  errors?: CallFormErrors;
  draft?: CallFormDraft;
};

export type CreateCourseInquiryState = {
  ok?: boolean;
  errors?: InquiryFormErrors;
  draft?: InquiryFormDraft;
};

export type SaveCallHoursState = {
  ok?: boolean;
  error?: string;
};

export type CancelCallState = {
  ok?: boolean;
  error?: string;
};

/**
 * `courseId` is `null` on the standalone advice page: the call is booked with
 * the same rules but is not attributed to a course.
 */
export async function scheduleCourseCallAction(
  locale: string,
  courseId: string | null,
  _previous: ScheduleCallState | null,
  formData: FormData,
): Promise<ScheduleCallState> {
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "CourseAdvice.errors",
  });
  const draft = readCallDraft(formData);
  const parsed = parseCallForm(formData);

  if (parsed.spam) {
    return {ok: true};
  }

  if (parsed.errors || !parsed.values) {
    return {
      errors: localizeCallErrors(parsed.errors ?? {form: "invalid"}, t),
      draft,
    };
  }

  const course = await resolveCourseContext(courseId, resolvedLocale);
  if (!course.ok) {
    return {errors: {form: t("courseMissing")}, draft};
  }

  try {
    const call = await scheduleCourseCall({
      date: parsed.values.date,
      time: parsed.values.time,
      firstName: parsed.values.firstName,
      lastName: parsed.values.lastName,
      email: parsed.values.email.toLowerCase(),
      phone: parsed.values.phone,
      locale: resolvedLocale,
      ...course.context,
      message: parsed.values.message,
      privacyAcceptedAt: new Date(),
    });

    const signedInUser = await getCurrentUser();
    try {
      await persistCheckoutContact({
        userId: signedInUser?.id,
        email: parsed.values.email,
        phone: parsed.values.phone,
      });
    } catch (error) {
      console.error("Failed to persist call contact", error);
    }

    try {
      await sendCourseCallConfirmation(call);
    } catch (error) {
      console.error("Failed to send call confirmation", error);
    }
    try {
      await sendCourseCallStaffNotification(call);
    } catch (error) {
      console.error("Failed to send call staff notification", error);
    }

    return {ok: true};
  } catch (error) {
    if (error instanceof CourseCallError) {
      if (error.code === "slotTaken") {
        return {errors: {slot: t("slotTaken"), form: t("slotTaken")}, draft};
      }
      if (error.code === "slotUnavailable") {
        return {errors: {slot: t("slotUnavailable"), form: t("slotUnavailable")}, draft};
      }
    }
    console.error("Failed to schedule course call", error);
    return {errors: {form: t("saveFailed")}, draft};
  }
}

/** `courseId` is `null` for a written question that is not about a course. */
export async function createCourseInquiryAction(
  locale: string,
  courseId: string | null,
  _previous: CreateCourseInquiryState | null,
  formData: FormData,
): Promise<CreateCourseInquiryState> {
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "CourseAdvice.errors",
  });
  const draft = readInquiryDraft(formData);
  const parsed = parseInquiryForm(formData);

  if (parsed.spam) {
    return {ok: true};
  }

  if (parsed.errors || !parsed.values) {
    return {
      errors: localizeInquiryErrors(parsed.errors ?? {form: "invalid"}, t),
      draft,
    };
  }

  const course = await resolveCourseContext(courseId, resolvedLocale);
  if (!course.ok) {
    return {errors: {form: t("courseMissing")}, draft};
  }

  try {
    const inquiry = await createCourseInquiry({
      firstName: parsed.values.firstName,
      lastName: parsed.values.lastName,
      email: parsed.values.email.toLowerCase(),
      phone: parsed.values.phone,
      message: parsed.values.message,
      locale: resolvedLocale,
      ...course.context,
      privacyAcceptedAt: new Date(),
    });

    const signedInUser = await getCurrentUser();
    try {
      await persistCheckoutContact({
        userId: signedInUser?.id,
        email: parsed.values.email,
        phone: parsed.values.phone,
      });
    } catch (error) {
      console.error("Failed to persist inquiry contact", error);
    }

    try {
      await sendCourseInquiryConfirmation(inquiry);
    } catch (error) {
      console.error("Failed to send inquiry confirmation", error);
    }
    try {
      await sendCourseInquiryStaffNotification(inquiry);
    } catch (error) {
      console.error("Failed to send inquiry staff notification", error);
    }

    return {ok: true};
  } catch (error) {
    console.error("Failed to save course inquiry", error);
    return {errors: {form: t("saveFailed")}, draft};
  }
}

export async function saveCallHoursAction(
  locale: string,
  _previous: SaveCallHoursState | null,
  formData: FormData,
): Promise<SaveCallHoursState> {
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "Admin",
  });
  const actor = await requireAdmin(resolvedLocale, localizedPath(resolvedLocale, "/admin/calls"));

  try {
    await saveCallHours({
      actor,
      hours: parseAdminHoursForm(formData),
    });
    return {ok: true};
  } catch (error) {
    if (error instanceof CourseCallError && error.code === "invalidHours") {
      return {error: t("callHoursInvalid")};
    }
    console.error("Failed to save call hours", error);
    return {error: t("callHoursSaveFailed")};
  }
}

export async function cancelCourseCallAction(
  locale: string,
  callId: string,
  _previous: CancelCallState | null,
  _formData: FormData,
): Promise<CancelCallState> {
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "Admin",
  });
  const actor = await requireAdmin(
    resolvedLocale,
    localizedPath(resolvedLocale, {
      pathname: "/admin/calls/[id]",
      params: {id: callId},
    }),
  );

  try {
    await cancelCourseCall({actor, id: callId});
    return {ok: true};
  } catch (error) {
    if (error instanceof CourseCallError) {
      if (error.code === "alreadyCancelled") {
        return {error: t("callAlreadyCancelled")};
      }
      if (error.code === "notFound") {
        return {error: t("callNotFound")};
      }
    }
    console.error("Failed to cancel course call", error);
    return {error: t("callCancelFailed")};
  }
}

function resolveLocale(locale: string): AppLocale {
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

/** Course attribution stored on the call or inquiry, empty when general. */
type CourseContext = {courseId?: string; courseTitle?: string};

/**
 * A missing `courseId` is the standalone page and always valid. A present one
 * must still resolve to a published course, or the request is stale.
 */
async function resolveCourseContext(
  courseId: string | null,
  locale: AppLocale,
): Promise<{ok: true; context: CourseContext} | {ok: false}> {
  if (!courseId) {
    return {ok: true, context: {}};
  }

  const course = await loadPublishedCourseById(courseId);
  if (!course) {
    return {ok: false};
  }

  return {
    ok: true,
    context: {courseId: course.id, courseTitle: course.title[locale]},
  };
}

const callErrorKeys = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "message",
  "date",
  "time",
  "privacyAccepted",
  "form",
  "slot",
] as const;

function localizeCallErrors(
  errors: CallFormErrors,
  t: (key: "firstName" | "lastName" | "email" | "phone" | "message" | "date" | "time" | "privacyAccepted" | "invalid" | "slotTaken" | "slotUnavailable") => string,
): CallFormErrors {
  const mapped: CallFormErrors = {};
  for (const key of callErrorKeys) {
    if (!errors[key]) {
      continue;
    }
    if (key === "form" || key === "slot") {
      mapped[key] = t("invalid");
    } else {
      mapped[key] = t(key);
    }
  }
  if (Object.keys(mapped).length === 0) {
    mapped.form = t("invalid");
  }
  return mapped;
}

const inquiryErrorKeys = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "message",
  "privacyAccepted",
  "form",
] as const;

function localizeInquiryErrors(
  errors: InquiryFormErrors,
  t: (key: "firstName" | "lastName" | "email" | "phone" | "message" | "privacyAccepted" | "invalid") => string,
): InquiryFormErrors {
  const mapped: InquiryFormErrors = {};
  for (const key of inquiryErrorKeys) {
    if (!errors[key]) {
      continue;
    }
    mapped[key] = key === "form" ? t("invalid") : t(key);
  }
  if (Object.keys(mapped).length === 0) {
    mapped.form = t("invalid");
  }
  return mapped;
}

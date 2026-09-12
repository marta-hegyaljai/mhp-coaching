"use server";

import {getTranslations} from "next-intl/server";
import {hasLocale} from "next-intl";

import {persistCheckoutContact} from "@/features/auth/contact";
import {getCurrentUser} from "@/features/auth/session";
import {sendWaitlistNotification} from "@/features/email/waitlist-notification";
import {loadPublishedCourseById} from "@/features/courses/live";
import {routing, type AppLocale} from "@/i18n/routing";

import {createWaitlistEntry} from "./repository";
import {
  parseWaitlistForm,
  readWaitlistDraft,
  type WaitlistFormDraft,
  type WaitlistFormErrors,
} from "./validation";

export type CreateWaitlistState = {
  ok?: boolean;
  alreadyListed?: boolean;
  errors?: WaitlistFormErrors;
  draft?: WaitlistFormDraft;
};

export async function createWaitlistAction(
  locale: string,
  courseId: string,
  _previous: CreateWaitlistState | null,
  formData: FormData,
): Promise<CreateWaitlistState> {
  const resolvedLocale: AppLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "WaitlistForm.errors",
  });
  const draft = readWaitlistDraft(formData);
  const parsed = parseWaitlistForm(formData);

  if (parsed.spam) {
    return {ok: true};
  }

  if (parsed.errors || !parsed.values) {
    return {
      errors: localizeErrors(parsed.errors ?? {form: "invalid"}, t),
      draft,
    };
  }

  const course = await loadPublishedCourseById(courseId);

  if (!course) {
    return {errors: {form: t("unavailable")}, draft};
  }

  let entry: Awaited<ReturnType<typeof createWaitlistEntry>>;

  try {
    entry = await createWaitlistEntry({
      courseId: course.id,
      courseTitle: course.title[resolvedLocale],
      firstName: parsed.values.firstName,
      lastName: parsed.values.lastName,
      email: parsed.values.email.toLowerCase(),
      phone: parsed.values.phone,
      locale: resolvedLocale,
      privacyAcceptedAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to save waitlist entry", error);
    return {errors: {form: t("saveFailed")}, draft};
  }

  if (entry === "duplicate") {
    return {alreadyListed: true, draft};
  }

  const signedInUser = await getCurrentUser();
  try {
    await persistCheckoutContact({
      userId: signedInUser?.id,
      email: parsed.values.email,
      phone: parsed.values.phone,
    });
  } catch (error) {
    console.error("Failed to persist waitlist contact", error);
  }

  try {
    await sendWaitlistNotification(entry);
  } catch (error) {
    console.error("Failed to send waitlist notification", error);
  }

  return {ok: true};
}

const errorKeys = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "privacyAccepted",
  "form",
] as const;

function localizeErrors(
  errors: WaitlistFormErrors,
  t: (
    key:
      | "firstName"
      | "lastName"
      | "email"
      | "phone"
      | "privacyAccepted"
      | "invalid"
      | "unavailable",
  ) => string,
): WaitlistFormErrors {
  const mapped: WaitlistFormErrors = {};

  for (const key of errorKeys) {
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

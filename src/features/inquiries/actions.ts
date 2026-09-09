"use server";

import {getTranslations} from "next-intl/server";
import {hasLocale} from "next-intl";

import {sendInquiryNotification} from "@/features/email/inquiry-notification";
import {routing, type AppLocale} from "@/i18n/routing";

import {createInquiry} from "./repository";
import {
  parseInquiryForm,
  readInquiryDraft,
  type InquiryFormDraft,
  type InquiryFormErrors,
} from "./validation";

export type CreateInquiryState = {
  ok?: boolean;
  errors?: InquiryFormErrors;
  draft?: InquiryFormDraft;
};

export async function createInquiryAction(
  locale: string,
  context: {kind: "general" | "payment"; bookingId?: string; courseId?: string; courseTitle?: string},
  _previous: CreateInquiryState | null,
  formData: FormData,
): Promise<CreateInquiryState> {
  const resolvedLocale: AppLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "ContactForm.errors",
  });
  const draft = readInquiryDraft(formData);
  const parsed = parseInquiryForm(formData);

  if (parsed.spam) {
    return {ok: true};
  }

  if (parsed.errors || !parsed.values) {
    return {
      errors: localizeErrors(parsed.errors ?? {form: "invalid"}, t),
      draft,
    };
  }

  let inquiry: Awaited<ReturnType<typeof createInquiry>>;

  try {
    inquiry = await createInquiry({
      name: parsed.values.name,
      email: parsed.values.email,
      phone: parsed.values.phone || null,
      message: parsed.values.message,
      locale: resolvedLocale,
      kind: context.kind,
      bookingId: context.bookingId,
      courseId: context.courseId,
      courseTitle: context.courseTitle,
    });
  } catch (error) {
    console.error("Failed to save inquiry", error);
    return {errors: {form: t("saveFailed")}, draft};
  }

  try {
    await sendInquiryNotification(inquiry);
  } catch (error) {
    console.error("Failed to send inquiry notification", error);
  }

  return {ok: true};
}

const errorKeys = ["name", "email", "phone", "message", "form"] as const;

function localizeErrors(
  errors: InquiryFormErrors,
  t: (key: "name" | "email" | "phone" | "message" | "invalid") => string,
): InquiryFormErrors {
  const mapped: InquiryFormErrors = {};

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

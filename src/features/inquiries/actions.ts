"use server";

import {revalidatePath} from "next/cache";
import {getTranslations} from "next-intl/server";
import {hasLocale} from "next-intl";

import {requireAdmin} from "@/features/auth/require";
import {sendInquiryNotification} from "@/features/email/inquiry-notification";
import {localizedPath} from "@/features/seo/metadata";
import {routing, type AppLocale} from "@/i18n/routing";

import {replyToInquiry} from "./admin-reply";
import {parseAdminMessageChannel, type AdminMessageChannel} from "./admin-message";
import {InquiryReplyError} from "./errors";
import {createInquiry} from "./repository";
import {
  parseInquiryReplyForm,
  readInquiryReplyDraft,
  type InquiryReplyErrors,
} from "./reply-validation";
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

export type ReplyInquiryState = {
  ok?: boolean;
  sentAt?: number;
  errors?: InquiryReplyErrors;
  draft?: string;
};

export async function replyInquiryAction(
  locale: string,
  inquiryId: string,
  channel: AdminMessageChannel,
  _previous: ReplyInquiryState | null,
  formData: FormData,
): Promise<ReplyInquiryState> {
  const resolvedLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "Admin",
  });
  const resolvedChannel = parseAdminMessageChannel(channel);
  const actor = await requireAdmin(
    resolvedLocale,
    localizedPath(resolvedLocale, {
      pathname: "/admin/calls/messages/[id]",
      params: {id: inquiryId},
      query: resolvedChannel === "course" ? undefined : {channel: resolvedChannel},
    }),
  );

  const draft = readInquiryReplyDraft(formData);
  const parsed = parseInquiryReplyForm(formData);
  if (parsed.errors || !parsed.values) {
    return {errors: {body: t("inquiryReplyInvalid")}, draft};
  }

  try {
    await replyToInquiry({
      actor,
      inquiryId,
      channel: resolvedChannel,
      body: parsed.values.body,
    });
  } catch (error) {
    if (error instanceof InquiryReplyError) {
      if (error.code === "notFound") {
        return {errors: {form: t("inquiryReplyNotFound")}, draft};
      }
      if (error.code === "invalidBody") {
        return {errors: {body: t("inquiryReplyInvalid")}, draft};
      }
      if (error.code === "sendFailed") {
        return {errors: {form: t("inquiryReplyFailed")}, draft};
      }
    }
    console.error("Failed to reply to inquiry", error);
    return {errors: {form: t("inquiryReplyFailed")}, draft};
  }

  revalidatePath("/", "layout");
  return {ok: true, sentAt: Date.now()};
}

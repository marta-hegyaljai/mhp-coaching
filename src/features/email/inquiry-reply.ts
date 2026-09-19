import {organization} from "@/features/organization/info";
import {mailLocale} from "@/features/email/locale";
import {composeTransactionalEmail, type EmailDetail} from "@/features/email/layout";
import {sendMail, type MailDelivery} from "@/features/email/transport";
import {getTranslations} from "next-intl/server";

/** Enough of an inbound message to write a visitor-facing reply. */
export type InquiryReplyMail = {
  to: string;
  locale: string;
  greetingName: string;
  courseTitle: string | null;
  originalMessage: string;
  body: string;
};

/**
 * Staff answer to a written question or contact-form message. Chrome follows
 * the visitor's locale; the typed body is sent as written.
 */
export async function sendInquiryReply(input: InquiryReplyMail): Promise<MailDelivery> {
  const locale = mailLocale(input.locale);
  const t = await getTranslations({locale, namespace: "Email.inquiryReply"});
  const fields = await getTranslations({locale, namespace: "Email.fields"});
  const greeting = t("greeting", {name: input.greetingName});
  const details: EmailDetail[] = [];
  if (input.courseTitle) {
    details.push({label: fields("course"), value: input.courseTitle});
  }
  if (input.originalMessage.trim()) {
    details.push({label: t("originalLabel"), value: input.originalMessage});
  }

  const text = [
    greeting,
    "",
    t("intro"),
    "",
    input.body,
    "",
    input.courseTitle ? t("courseLine", {course: input.courseTitle}) : "",
    t("originalLine"),
    input.originalMessage,
    "",
    t("closing"),
  ]
    .filter((line) => line.length > 0)
    .join("\n");

  const html = composeTransactionalEmail({
    locale,
    preheader: t("intro"),
    eyebrow: t("eyebrow"),
    title: input.courseTitle ?? t("title"),
    greeting,
    intro: t("intro"),
    details: details.length > 0 ? details : undefined,
    message: input.body,
    closing: t("closing"),
  });

  return sendMail({
    to: input.to,
    replyTo: organization.email,
    subject: input.courseTitle
      ? t("subjectCourse", {course: input.courseTitle})
      : t("subject"),
    text,
    html,
  });
}

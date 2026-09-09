import {getTranslations} from "next-intl/server";
import {hasLocale} from "next-intl";

import type {Inquiry} from "@/db/schema";
import {organization} from "@/features/organization/info";
import {routing, type AppLocale} from "@/i18n/routing";

import {sendMail} from "./transport";

export async function sendInquiryNotification(inquiry: Inquiry): Promise<void> {
  const locale: AppLocale = hasLocale(routing.locales, inquiry.locale)
    ? inquiry.locale
    : "fr";
  const t = await getTranslations({locale, namespace: "Email.inquiryNotification"});
  const subject = t("subject", {
    kind: inquiry.kind === "payment" ? t("kindPayment") : t("kindGeneral"),
  });
  const text = [
    t("intro"),
    "",
    t("nameLine", {name: inquiry.name}),
    t("emailLine", {email: inquiry.email}),
    inquiry.phone ? t("phoneLine", {phone: inquiry.phone}) : "",
    inquiry.courseTitle ? t("courseLine", {course: inquiry.courseTitle}) : "",
    t("messageLine"),
    inquiry.message,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <p>${escapeHtml(t("intro"))}</p>
    <ul>
      <li>${escapeHtml(t("nameLine", {name: inquiry.name}))}</li>
      <li>${escapeHtml(t("emailLine", {email: inquiry.email}))}</li>
      ${inquiry.phone ? `<li>${escapeHtml(t("phoneLine", {phone: inquiry.phone}))}</li>` : ""}
      ${inquiry.courseTitle ? `<li>${escapeHtml(t("courseLine", {course: inquiry.courseTitle}))}</li>` : ""}
    </ul>
    <p>${escapeHtml(t("messageLine"))}</p>
    <p>${escapeHtml(inquiry.message).replaceAll("\n", "<br/>")}</p>
  `;

  await sendMail({
    to: organization.email,
    replyTo: inquiry.email,
    subject,
    text,
    html,
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

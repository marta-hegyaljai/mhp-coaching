import {getTranslations} from "next-intl/server";
import {hasLocale} from "next-intl";

import type {WaitlistEntry} from "@/db/schema";
import {organization} from "@/features/organization/info";
import {routing, type AppLocale} from "@/i18n/routing";

import {sendMail} from "./transport";

export async function sendWaitlistNotification(
  entry: WaitlistEntry,
): Promise<void> {
  const locale: AppLocale = hasLocale(routing.locales, entry.locale)
    ? entry.locale
    : "fr";
  const t = await getTranslations({
    locale,
    namespace: "Email.waitlistNotification",
  });
  const subject = t("subject", {course: entry.courseTitle});
  const name = `${entry.firstName} ${entry.lastName}`;
  const text = [
    t("intro"),
    "",
    t("nameLine", {name}),
    t("emailLine", {email: entry.email}),
    t("phoneLine", {phone: entry.phone}),
    t("courseLine", {course: entry.courseTitle}),
  ].join("\n");

  const html = `
    <p>${escapeHtml(t("intro"))}</p>
    <ul>
      <li>${escapeHtml(t("nameLine", {name}))}</li>
      <li>${escapeHtml(t("emailLine", {email: entry.email}))}</li>
      <li>${escapeHtml(t("phoneLine", {phone: entry.phone}))}</li>
      <li>${escapeHtml(t("courseLine", {course: entry.courseTitle}))}</li>
    </ul>
  `;

  await sendMail({
    to: organization.email,
    replyTo: entry.email,
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

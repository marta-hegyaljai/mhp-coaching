import {getTranslations} from "next-intl/server";

import type {WaitlistEntry} from "@/db/schema";
import {organization} from "@/features/organization/info";

import {composeTransactionalEmail} from "./layout";
import {mailLocale} from "./locale";
import {sendMail} from "./transport";

export async function sendWaitlistNotification(
  entry: WaitlistEntry,
  sessionLabel?: string,
): Promise<void> {
  const locale = mailLocale(entry.locale);
  const t = await getTranslations({
    locale,
    namespace: "Email.waitlistNotification",
  });
  const fields = await getTranslations({locale, namespace: "Email.fields"});
  const subject = t("subject", {course: entry.courseTitle});
  const name = `${entry.firstName} ${entry.lastName}`;
  const textLines = [
    t("intro"),
    "",
    t("nameLine", {name}),
    t("emailLine", {email: entry.email}),
  ];
  if (entry.phone.trim()) {
    textLines.push(t("phoneLine", {phone: entry.phone}));
  }
  textLines.push(t("courseLine", {course: entry.courseTitle}));
  if (sessionLabel) {
    textLines.push(t("sessionLine", {date: sessionLabel}));
  }

  const details = [
    {label: fields("name"), value: name},
    {label: fields("email"), value: entry.email},
    ...(entry.phone.trim() ? [{label: fields("phone"), value: entry.phone}] : []),
    {label: fields("course"), value: entry.courseTitle},
    ...(sessionLabel ? [{label: fields("dates"), value: sessionLabel}] : []),
  ];

  const html = composeTransactionalEmail({
    locale,
    preheader: t("intro"),
    eyebrow: t("eyebrow"),
    title: entry.courseTitle,
    intro: t("intro"),
    details,
  });

  await sendMail({
    to: organization.email,
    replyTo: entry.email,
    subject,
    text: textLines.join("\n"),
    html,
  });
}

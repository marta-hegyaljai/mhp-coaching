import {getTranslations} from "next-intl/server";

import type {WaitlistEntry} from "@/db/schema";
import {organization} from "@/features/organization/info";

import {composeTransactionalEmail} from "./layout";
import {mailLocale} from "./locale";
import {sendMail} from "./transport";

export async function sendWaitlistNotification(
  entry: WaitlistEntry,
): Promise<void> {
  const locale = mailLocale(entry.locale);
  const t = await getTranslations({
    locale,
    namespace: "Email.waitlistNotification",
  });
  const fields = await getTranslations({locale, namespace: "Email.fields"});
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

  const html = composeTransactionalEmail({
    locale,
    preheader: t("intro"),
    eyebrow: t("eyebrow"),
    title: entry.courseTitle,
    intro: t("intro"),
    details: [
      {label: fields("name"), value: name},
      {label: fields("email"), value: entry.email},
      {label: fields("phone"), value: entry.phone},
      {label: fields("course"), value: entry.courseTitle},
    ],
  });

  await sendMail({
    to: organization.email,
    replyTo: entry.email,
    subject,
    text,
    html,
  });
}

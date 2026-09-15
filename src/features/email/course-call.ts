import type {CourseCall, CourseInquiry} from "@/db/schema";
import {organization} from "@/features/organization/info";
import {mailLocale} from "@/features/email/locale";
import {composeTransactionalEmail, type EmailDetail} from "@/features/email/layout";
import {sendMail} from "@/features/email/transport";
import {getTranslations} from "next-intl/server";

import {callPersonName, callWhen} from "@/features/course-calls/format";

export async function sendCourseCallConfirmation(call: CourseCall): Promise<void> {
  const locale = mailLocale(call.locale);
  const t = await getTranslations({locale, namespace: "Email.courseCallConfirmation"});
  const fields = await getTranslations({locale, namespace: "Email.fields"});
  const when = callWhen(call.startsAt, call.endsAt, locale);
  const name = callPersonName(call.firstName, call.lastName);
  const greeting = t("greeting", {name: call.firstName});
  const details = callDetails(fields, call, when, name);
  const text = [
    greeting,
    "",
    t("intro"),
    "",
    t("dateLine", {date: when.weekdayDate}),
    t("timeLine", {time: when.timeLabel}),
    call.courseTitle ? t("courseLine", {course: call.courseTitle}) : "",
    t("phoneLine", {phone: call.phone}),
    "",
    t("closing"),
  ]
    .filter((line) => line.length > 0)
    .join("\n");

  const html = composeTransactionalEmail({
    locale,
    preheader: t("intro"),
    eyebrow: t("eyebrow"),
    title: t("title"),
    greeting,
    intro: t("intro"),
    details,
    closing: t("closing"),
  });

  await sendMail({
    to: call.email,
    subject: t("subject"),
    text,
    html,
  });
}

export async function sendCourseCallStaffNotification(call: CourseCall): Promise<void> {
  const locale = mailLocale(call.locale);
  const t = await getTranslations({locale, namespace: "Email.courseCallStaff"});
  const fields = await getTranslations({locale, namespace: "Email.fields"});
  const when = callWhen(call.startsAt, call.endsAt, locale);
  const name = callPersonName(call.firstName, call.lastName);
  const details = callDetails(fields, call, when, name);
  const text = [
    t("intro"),
    "",
    t("nameLine", {name}),
    t("emailLine", {email: call.email}),
    t("phoneLine", {phone: call.phone}),
    t("dateLine", {date: when.weekdayDate}),
    t("timeLine", {time: when.timeLabel}),
    call.courseTitle ? t("courseLine", {course: call.courseTitle}) : "",
    call.message ? t("messageLine") : "",
    call.message ?? "",
  ]
    .filter((line) => line.length > 0)
    .join("\n");

  const html = composeTransactionalEmail({
    locale,
    preheader: t("intro"),
    eyebrow: t("eyebrow"),
    title: name,
    intro: t("intro"),
    details,
    messageLabel: call.message ? t("messageLine") : undefined,
    message: call.message ?? undefined,
  });

  await sendMail({
    to: organization.email,
    replyTo: call.email,
    subject: t("subject", {name}),
    text,
    html,
  });
}

export async function sendCourseInquiryConfirmation(inquiry: CourseInquiry): Promise<void> {
  const locale = mailLocale(inquiry.locale);
  const t = await getTranslations({
    locale,
    namespace: "Email.courseInquiryConfirmation",
  });
  const fields = await getTranslations({locale, namespace: "Email.fields"});
  const name = callPersonName(inquiry.firstName, inquiry.lastName);
  const greeting = t("greeting", {name: inquiry.firstName});
  const details: EmailDetail[] = [
    {label: fields("name"), value: name},
    {label: fields("email"), value: inquiry.email},
    {label: fields("phone"), value: inquiry.phone},
  ];
  if (inquiry.courseTitle) {
    details.push({label: fields("course"), value: inquiry.courseTitle});
  }

  const text = [
    greeting,
    "",
    t("intro"),
    inquiry.courseTitle ? t("courseLine", {course: inquiry.courseTitle}) : "",
    "",
    t("closing"),
  ]
    .filter((line) => line.length > 0)
    .join("\n");

  const html = composeTransactionalEmail({
    locale,
    preheader: t("intro"),
    eyebrow: t("eyebrow"),
    title: t("title"),
    greeting,
    intro: t("intro"),
    details,
    closing: t("closing"),
  });

  await sendMail({
    to: inquiry.email,
    subject: t("subject"),
    text,
    html,
  });
}

export async function sendCourseInquiryStaffNotification(
  inquiry: CourseInquiry,
): Promise<void> {
  const locale = mailLocale(inquiry.locale);
  const t = await getTranslations({locale, namespace: "Email.courseInquiryStaff"});
  const fields = await getTranslations({locale, namespace: "Email.fields"});
  const name = callPersonName(inquiry.firstName, inquiry.lastName);
  const details: EmailDetail[] = [
    {label: fields("name"), value: name},
    {label: fields("email"), value: inquiry.email},
    {label: fields("phone"), value: inquiry.phone},
  ];
  if (inquiry.courseTitle) {
    details.push({label: fields("course"), value: inquiry.courseTitle});
  }

  const text = [
    t("intro"),
    "",
    t("nameLine", {name}),
    t("emailLine", {email: inquiry.email}),
    t("phoneLine", {phone: inquiry.phone}),
    inquiry.courseTitle ? t("courseLine", {course: inquiry.courseTitle}) : "",
    t("messageLine"),
    inquiry.message,
  ]
    .filter((line) => line.length > 0)
    .join("\n");

  const html = composeTransactionalEmail({
    locale,
    preheader: t("intro"),
    eyebrow: t("eyebrow"),
    title: name,
    intro: t("intro"),
    details,
    messageLabel: t("messageLine"),
    message: inquiry.message,
  });

  await sendMail({
    to: organization.email,
    replyTo: inquiry.email,
    subject: t("subject", {name}),
    text,
    html,
  });
}

function callDetails(
  fields: (key: "name" | "email" | "phone" | "course" | "dates" | "time") => string,
  call: CourseCall,
  when: {weekdayDate: string; timeLabel: string},
  name: string,
): EmailDetail[] {
  const details: EmailDetail[] = [
    {label: fields("name"), value: name},
    {label: fields("email"), value: call.email},
    {label: fields("phone"), value: call.phone},
    {label: fields("dates"), value: when.weekdayDate},
    {label: fields("time"), value: when.timeLabel},
  ];
  if (call.courseTitle) {
    details.push({label: fields("course"), value: call.courseTitle});
  }
  return details;
}

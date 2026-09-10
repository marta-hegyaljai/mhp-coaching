import {getTranslations} from "next-intl/server";

import type {Inquiry} from "@/db/schema";
import {isDateToBeConfirmed} from "@/features/bookings/booking-date";
import {getBookingById} from "@/features/bookings/repository";
import {formatDateRange} from "@/features/courses/dates";
import {organization} from "@/features/organization/info";

import {composeTransactionalEmail, type EmailDetail} from "./layout";
import {mailLocale} from "./locale";
import {sendMail} from "./transport";

export async function sendInquiryNotification(inquiry: Inquiry): Promise<void> {
  const locale = mailLocale(inquiry.locale);
  const t = await getTranslations({locale, namespace: "Email.inquiryNotification"});
  const fields = await getTranslations({locale, namespace: "Email.fields"});
  const booking = await loadInquiryBooking(inquiry.bookingId);
  const courseTitle = inquiry.courseTitle ?? booking?.courseTitle;
  const dateLabel = booking
    ? isDateToBeConfirmed(booking.courseDateStart)
      ? fields("dateToBeConfirmed")
      : formatDateRange(booking.courseDateStart, booking.courseDateEnd, locale)
    : undefined;
  const kindLabel =
    inquiry.kind === "payment" ? t("kindPayment") : t("kindGeneral");
  const subject = t("subject", {kind: kindLabel});
  const details: EmailDetail[] = [
    {label: fields("name"), value: inquiry.name},
    {label: fields("email"), value: inquiry.email},
  ];
  if (inquiry.phone) {
    details.push({label: fields("phone"), value: inquiry.phone});
  }
  if (courseTitle) {
    details.push({label: fields("course"), value: courseTitle});
  }
  if (dateLabel) {
    details.push({label: fields("dates"), value: dateLabel});
  }
  if (inquiry.bookingId) {
    details.push({label: fields("reference"), value: inquiry.bookingId});
  }

  const text = [
    t("intro"),
    "",
    t("nameLine", {name: inquiry.name}),
    t("emailLine", {email: inquiry.email}),
    inquiry.phone ? t("phoneLine", {phone: inquiry.phone}) : "",
    courseTitle ? t("courseLine", {course: courseTitle}) : "",
    dateLabel ? t("dateLine", {date: dateLabel}) : "",
    inquiry.bookingId ? t("referenceLine", {id: inquiry.bookingId}) : "",
    t("messageLine"),
    inquiry.message,
  ]
    .filter(Boolean)
    .join("\n");

  const html = composeTransactionalEmail({
    locale,
    preheader: t("intro"),
    eyebrow:
      inquiry.kind === "payment" ? t("eyebrowPayment") : t("eyebrowGeneral"),
    title: courseTitle ?? inquiry.name,
    intro: t("intro"),
    details,
    messageLabel: t("messageLine"),
    message: inquiry.message,
  });

  await sendMail({
    to: organization.email,
    replyTo: inquiry.email,
    subject,
    text,
    html,
  });
}

async function loadInquiryBooking(bookingId: string | null) {
  if (!bookingId) {
    return undefined;
  }

  try {
    return await getBookingById(bookingId);
  } catch (error) {
    console.error("Failed to load booking for inquiry notification", error);
    return undefined;
  }
}

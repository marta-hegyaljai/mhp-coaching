import {getTranslations} from "next-intl/server";
import {hasLocale} from "next-intl";

import type {Inquiry} from "@/db/schema";
import {isDateToBeConfirmed} from "@/features/bookings/booking-date";
import {getBookingById} from "@/features/bookings/repository";
import {formatDateRange} from "@/features/courses/dates";
import {organization} from "@/features/organization/info";
import {routing, type AppLocale} from "@/i18n/routing";

import {sendMail} from "./transport";

export async function sendInquiryNotification(inquiry: Inquiry): Promise<void> {
  const locale: AppLocale = hasLocale(routing.locales, inquiry.locale)
    ? inquiry.locale
    : "fr";
  const t = await getTranslations({locale, namespace: "Email.inquiryNotification"});
  const booking = await loadInquiryBooking(inquiry.bookingId);
  const courseTitle = inquiry.courseTitle ?? booking?.courseTitle;
  const dateLabel = booking
    ? isDateToBeConfirmed(booking.courseDateStart)
      ? t("dateToBeConfirmed")
      : formatDateRange(booking.courseDateStart, booking.courseDateEnd, locale)
    : undefined;
  const subject = t("subject", {
    kind: inquiry.kind === "payment" ? t("kindPayment") : t("kindGeneral"),
  });
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

  const html = `
    <p>${escapeHtml(t("intro"))}</p>
    <ul>
      <li>${escapeHtml(t("nameLine", {name: inquiry.name}))}</li>
      <li>${escapeHtml(t("emailLine", {email: inquiry.email}))}</li>
      ${inquiry.phone ? `<li>${escapeHtml(t("phoneLine", {phone: inquiry.phone}))}</li>` : ""}
      ${courseTitle ? `<li>${escapeHtml(t("courseLine", {course: courseTitle}))}</li>` : ""}
      ${dateLabel ? `<li>${escapeHtml(t("dateLine", {date: dateLabel}))}</li>` : ""}
      ${inquiry.bookingId ? `<li>${escapeHtml(t("referenceLine", {id: inquiry.bookingId}))}</li>` : ""}
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

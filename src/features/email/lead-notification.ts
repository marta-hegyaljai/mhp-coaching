import {getTranslations} from "next-intl/server";
import {hasLocale} from "next-intl";

import {formatDateRange} from "@/features/courses/dates";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {routing, type AppLocale} from "@/i18n/routing";
import {organization} from "@/features/organization/info";
import type {Booking} from "@/db/schema";
import {isDateToBeConfirmed} from "@/features/bookings/booking-date";

import {sendMail} from "./transport";

export async function sendLeadNotification(booking: Booking): Promise<void> {
  const locale: AppLocale = hasLocale(routing.locales, booking.locale)
    ? booking.locale
    : "fr";
  const t = await getTranslations({locale, namespace: "Email.leadNotification"});
  const dateLabel = isDateToBeConfirmed(booking.courseDateStart)
    ? t("dateToBeConfirmed")
    : formatDateRange(booking.courseDateStart, booking.courseDateEnd, locale);
  const amount = formatChf(minorUnitsToFrancs(booking.amountMinor), locale);
  const address = `${booking.street}, ${booking.postalCode} ${booking.city}, ${booking.country}`;
  const subject = t("subject", {course: booking.courseTitle});
  const text = [
    t("intro"),
    "",
    t("nameLine", {name: `${booking.firstName} ${booking.lastName}`}),
    t("emailLine", {email: booking.email}),
    t("phoneLine", {phone: booking.phone}),
    t("addressLine", {address}),
    t("courseLine", {course: booking.courseTitle}),
    t("dateLine", {date: dateLabel}),
    t("amountLine", {amount}),
    t("referenceLine", {id: booking.id}),
  ].join("\n");

  const html = `
    <p>${escapeHtml(t("intro"))}</p>
    <ul>
      <li>${escapeHtml(t("nameLine", {name: `${booking.firstName} ${booking.lastName}`}))}</li>
      <li>${escapeHtml(t("emailLine", {email: booking.email}))}</li>
      <li>${escapeHtml(t("phoneLine", {phone: booking.phone}))}</li>
      <li>${escapeHtml(t("addressLine", {address}))}</li>
      <li>${escapeHtml(t("courseLine", {course: booking.courseTitle}))}</li>
      <li>${escapeHtml(t("dateLine", {date: dateLabel}))}</li>
      <li>${escapeHtml(t("amountLine", {amount}))}</li>
      <li>${escapeHtml(t("referenceLine", {id: booking.id}))}</li>
    </ul>
  `;

  await sendMail({
    to: organization.email,
    replyTo: booking.email,
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

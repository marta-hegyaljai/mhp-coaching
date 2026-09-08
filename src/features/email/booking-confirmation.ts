import {getTranslations} from "next-intl/server";

import {formatDateRange} from "@/features/courses/dates";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {hasLocale} from "next-intl";
import {routing, type AppLocale} from "@/i18n/routing";
import {organization} from "@/features/organization/info";
import type {Booking} from "@/db/schema";

import {sendMail} from "./transport";

export async function sendBookingConfirmation(booking: Booking): Promise<void> {
  const locale: AppLocale = hasLocale(routing.locales, booking.locale)
    ? booking.locale
    : "fr";
  const t = await getTranslations({locale, namespace: "Email.bookingConfirmation"});
  const dateLabel = formatDateRange(
    booking.courseDateStart,
    booking.courseDateEnd,
    locale,
  );
  const amount = formatChf(minorUnitsToFrancs(booking.amountMinor), locale);
  const subject = t("subject", {course: booking.courseTitle});
  const text = [
    t("greeting", {name: booking.firstName}),
    "",
    t("intro"),
    "",
    t("detailsTitle"),
    t("courseLine", {course: booking.courseTitle}),
    t("dateLine", {date: dateLabel}),
    t("locationLine", {location: booking.location}),
    t("amountLine", {amount}),
    t("referenceLine", {id: booking.id}),
    "",
    t("closing"),
    organization.brandName,
    organization.email,
    organization.phone,
  ].join("\n");

  const html = `
    <p>${escapeHtml(t("greeting", {name: booking.firstName}))}</p>
    <p>${escapeHtml(t("intro"))}</p>
    <p><strong>${escapeHtml(t("detailsTitle"))}</strong></p>
    <ul>
      <li>${escapeHtml(t("courseLine", {course: booking.courseTitle}))}</li>
      <li>${escapeHtml(t("dateLine", {date: dateLabel}))}</li>
      <li>${escapeHtml(t("locationLine", {location: booking.location}))}</li>
      <li>${escapeHtml(t("amountLine", {amount}))}</li>
      <li>${escapeHtml(t("referenceLine", {id: booking.id}))}</li>
    </ul>
    <p>${escapeHtml(t("closing"))}</p>
    <p>${escapeHtml(organization.brandName)}<br/>${escapeHtml(organization.email)}<br/>${escapeHtml(organization.phone)}</p>
  `;

  await sendMail({
    to: booking.email,
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

import {getTranslations} from "next-intl/server";

import {formatDateRange} from "@/features/courses/dates";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {organization} from "@/features/organization/info";
import type {Booking} from "@/db/schema";
import {isDateToBeConfirmed} from "@/features/bookings/booking-date";
import {formatLongDate} from "@/shared/format/calendar-date";

import {composeTransactionalEmail} from "./layout";
import {mailLocale} from "./locale";
import {sendMail} from "./transport";

export async function sendLeadNotification(booking: Booking): Promise<void> {
  const locale = mailLocale(booking.locale);
  const t = await getTranslations({locale, namespace: "Email.leadNotification"});
  const fields = await getTranslations({locale, namespace: "Email.fields"});
  const dateLabel = isDateToBeConfirmed(booking.courseDateStart)
    ? fields("dateToBeConfirmed")
    : formatDateRange(booking.courseDateStart, booking.courseDateEnd, locale);
  const amount = formatChf(minorUnitsToFrancs(booking.amountMinor), locale);
  const address = `${booking.street}, ${booking.postalCode} ${booking.city}, ${booking.country}`;
  const name = `${booking.firstName} ${booking.lastName}`;
  const dateOfBirth = booking.dateOfBirth
    ? formatLongDate(booking.dateOfBirth, locale)
    : null;
  const subject = t("subject", {course: booking.courseTitle});
  const text = [
    t("intro"),
    "",
    t("nameLine", {name}),
    ...(dateOfBirth ? [t("dateOfBirthLine", {date: dateOfBirth})] : []),
    t("emailLine", {email: booking.email}),
    t("phoneLine", {phone: booking.phone}),
    t("addressLine", {address}),
    t("courseLine", {course: booking.courseTitle}),
    t("dateLine", {date: dateLabel}),
    t("amountLine", {amount}),
    t("referenceLine", {id: booking.id}),
  ].join("\n");

  const html = composeTransactionalEmail({
    locale,
    preheader: t("intro"),
    eyebrow: t("eyebrow"),
    title: booking.courseTitle,
    intro: t("intro"),
    details: [
      {label: fields("name"), value: name},
      ...(dateOfBirth
        ? [{label: fields("dateOfBirth"), value: dateOfBirth}]
        : []),
      {label: fields("email"), value: booking.email},
      {label: fields("phone"), value: booking.phone},
      {label: fields("address"), value: address},
      {label: fields("course"), value: booking.courseTitle},
      {label: fields("dates"), value: dateLabel},
      {label: fields("amount"), value: amount},
      {label: fields("reference"), value: booking.id},
    ],
  });

  await sendMail({
    to: organization.email,
    replyTo: booking.email,
    subject,
    text,
    html,
  });
}

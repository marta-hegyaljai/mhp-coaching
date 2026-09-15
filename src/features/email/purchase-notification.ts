import {getTranslations} from "next-intl/server";

import type {Booking} from "@/db/schema";
import {isDateToBeConfirmed} from "@/features/bookings/booking-date";
import {formatDateRange} from "@/features/courses/dates";
import {organization} from "@/features/organization/info";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {formatLongDate} from "@/shared/format/calendar-date";

import {composeTransactionalEmail} from "./layout";
import {mailLocale} from "./locale";
import {sendMail} from "./transport";

export type PurchaseOutcome = "paid" | "failed";

export async function sendPurchaseNotification(
  booking: Booking,
  outcome: PurchaseOutcome,
): Promise<void> {
  const locale = mailLocale(booking.locale);
  const t = await getTranslations({
    locale,
    namespace: "Email.purchaseNotification",
  });
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
  const subject =
    outcome === "paid"
      ? t("subjectPaid", {course: booking.courseTitle})
      : t("subjectFailed", {course: booking.courseTitle});
  const intro = outcome === "paid" ? t("introPaid") : t("introFailed");
  const statusValue =
    outcome === "paid" ? fields("statusPaid") : fields("statusFailed");
  const text = [
    intro,
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
    `${fields("status")}: ${statusValue}`,
  ].join("\n");

  const html = composeTransactionalEmail({
    locale,
    preheader: intro,
    eyebrow: outcome === "paid" ? t("eyebrowPaid") : t("eyebrowFailed"),
    title: booking.courseTitle,
    intro,
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
      {label: fields("status"), value: statusValue},
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

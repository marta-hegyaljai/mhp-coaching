import {getTranslations} from "next-intl/server";

import {formatDateRange} from "@/features/courses/dates";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {organization} from "@/features/organization/info";
import type {Booking} from "@/db/schema";
import {isDateToBeConfirmed} from "@/features/bookings/booking-date";

import {composeTransactionalEmail} from "./layout";
import {mailLocale} from "./locale";
import {sendMail} from "./transport";

export async function sendBookingConfirmation(booking: Booking): Promise<void> {
  const locale = mailLocale(booking.locale);
  const t = await getTranslations({locale, namespace: "Email.bookingConfirmation"});
  const fields = await getTranslations({locale, namespace: "Email.fields"});
  const dateLabel = isDateToBeConfirmed(booking.courseDateStart)
    ? fields("dateToBeConfirmed")
    : formatDateRange(
        booking.courseDateStart,
        booking.courseDateEnd,
        locale,
      );
  const amount = formatChf(minorUnitsToFrancs(booking.amountMinor), locale);
  const venueAddress = organization.courseVenueAddress;
  const greeting = t("greeting", {name: booking.firstName});
  const subject = t("subject", {course: booking.courseTitle});
  const text = [
    greeting,
    "",
    t("intro"),
    "",
    t("detailsTitle"),
    t("courseLine", {course: booking.courseTitle}),
    t("dateLine", {date: dateLabel}),
    t("locationLine", {location: booking.location}),
    t("amountLine", {amount}),
    t("addressLine", {address: venueAddress}),
    "",
    t("closing"),
    organization.brandName,
    organization.email,
    organization.phone,
  ].join("\n");

  const html = composeTransactionalEmail({
    locale,
    preheader: t("intro"),
    eyebrow: t("eyebrow"),
    title: booking.courseTitle,
    greeting,
    intro: t("intro"),
    details: [
      {label: fields("course"), value: booking.courseTitle},
      {label: fields("dates"), value: dateLabel},
      {label: fields("location"), value: booking.location},
      {label: fields("amountPaid"), value: amount},
      {label: fields("address"), value: venueAddress},
    ],
    closing: t("closing"),
  });

  await sendMail({
    to: booking.email,
    subject,
    text,
    html,
  });
}

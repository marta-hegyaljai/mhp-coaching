import {getTranslations} from "next-intl/server";

import {formatDateRange} from "@/features/courses/dates";
import {formatCataloguePrice} from "@/features/courses/price";
import {isComplimentaryCourse} from "@/features/courses/types";
import {minorUnitsToFrancs} from "@/features/payments/money";
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
  const complimentary = isComplimentaryCourse({
    priceChf: minorUnitsToFrancs(booking.amountMinor),
  });
  const amount = formatCataloguePrice(
    minorUnitsToFrancs(booking.amountMinor),
    locale,
  );
  const intro = complimentary ? t("introFree") : t("intro");
  const amountLine = complimentary
    ? t("amountLineFree", {amount})
    : t("amountLine", {amount});
  const inPerson = /fribourg|freiburg/i.test(booking.location);
  const venueAddress = inPerson ? organization.courseVenueAddress : null;
  const greeting = t("greeting", {name: booking.firstName});
  const subject = t("subject", {course: booking.courseTitle});
  const text = [
    greeting,
    "",
    intro,
    "",
    t("detailsTitle"),
    t("courseLine", {course: booking.courseTitle}),
    t("dateLine", {date: dateLabel}),
    t("locationLine", {location: booking.location}),
    amountLine,
    ...(venueAddress ? [t("addressLine", {address: venueAddress})] : []),
    "",
    t("closing"),
    organization.brandName,
    organization.email,
    organization.phone,
  ].join("\n");

  const html = composeTransactionalEmail({
    locale,
    preheader: intro,
    eyebrow: t("eyebrow"),
    title: booking.courseTitle,
    greeting,
    intro,
    details: [
      {label: fields("course"), value: booking.courseTitle},
      {label: fields("dates"), value: dateLabel},
      {label: fields("location"), value: booking.location},
      {
        label: complimentary ? fields("amount") : fields("amountPaid"),
        value: amount,
      },
      ...(venueAddress ? [{label: fields("address"), value: venueAddress}] : []),
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

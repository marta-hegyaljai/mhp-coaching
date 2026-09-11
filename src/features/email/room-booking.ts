import {getTranslations} from "next-intl/server";

import type {RoomBooking, User} from "@/db/schema";
import {composeTransactionalEmail} from "@/features/email/layout";
import {mailLocale} from "@/features/email/locale";
import {sendMail} from "@/features/email/transport";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {formatZurichRange} from "@/features/rooms/timezone";
import {localizedPathname} from "@/i18n/path";
import {getSiteUrl} from "@/lib/site-url";

async function sendAdminRoomBookingMail(input: {
  user: User;
  booking: RoomBooking;
  copy: "adminCreated" | "adminMoved";
}): Promise<void> {
  const locale = mailLocale(input.user.locale);
  const t = await getTranslations({locale, namespace: `Email.${input.copy}`});
  const fields = await getTranslations({locale, namespace: "Email.fields"});
  const amount = formatChf(minorUnitsToFrancs(input.booking.amountMinor), locale);
  const time = formatZurichRange(input.booking.startsAt, input.booking.endsAt);
  const bookingsPath = localizedPathname(locale, "/rooms/bookings");
  const bookingsUrl = new URL(bookingsPath, getSiteUrl()).toString();
  const greeting = t("greeting", {name: input.user.firstName});
  const text = [
    greeting,
    "",
    t("intro"),
    "",
    t("roomLine", {room: input.booking.roomName}),
    t("timeLine", {time}),
    t("amountLine", {amount}),
    "",
    t("linkLine", {url: bookingsUrl}),
    "",
    t("closing"),
  ].join("\n");

  const html = composeTransactionalEmail({
    locale,
    preheader: t("intro"),
    eyebrow: t("eyebrow"),
    title: t("title"),
    greeting,
    intro: t("intro"),
    details: [
      {label: fields("room"), value: input.booking.roomName},
      {label: fields("time"), value: time},
      {label: fields("amount"), value: amount},
      {label: fields("link"), value: bookingsUrl, href: bookingsUrl},
    ],
    closing: t("closing"),
  });

  await sendMail({
    to: input.user.email,
    subject: t("subject", {room: input.booking.roomName}),
    text,
    html,
  });
}

export async function sendAdminCreatedRoomBooking(input: {
  user: User;
  booking: RoomBooking;
}): Promise<void> {
  await sendAdminRoomBookingMail({...input, copy: "adminCreated"});
}

export async function sendAdminMovedRoomBooking(input: {
  user: User;
  booking: RoomBooking;
}): Promise<void> {
  await sendAdminRoomBookingMail({...input, copy: "adminMoved"});
}

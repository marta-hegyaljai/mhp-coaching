import {getTranslations} from "next-intl/server";

import type {RoomBooking, User} from "@/db/schema";
import {composeTransactionalEmail} from "@/features/email/layout";
import {mailLocale} from "@/features/email/locale";
import {sendMail, type MailDelivery} from "@/features/email/transport";
import {organization} from "@/features/organization/info";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {formatZurichRange} from "@/features/rooms/timezone";
import {localizedPathname} from "@/i18n/path";
import {getSiteUrl} from "@/lib/site-url";
import type {PathnameHref} from "@/i18n/href";

type RoomMailCopy =
  | "adminCreated"
  | "adminMoved"
  | "bookingConfirmed"
  | "bookingChanged"
  | "bookingCancelled"
  | "bookingReminder";

async function absoluteUrl(locale: ReturnType<typeof mailLocale>, href: PathnameHref): Promise<string> {
  const path = localizedPathname(locale, href);
  return new URL(path, getSiteUrl()).toString();
}

async function sendUserRoomMail(input: {
  user: User;
  copy: RoomMailCopy;
  roomName: string;
  time: string;
  amount: string;
    href: PathnameHref;
}): Promise<MailDelivery> {
  const locale = mailLocale(input.user.locale);
  const t = await getTranslations({locale, namespace: `Email.${input.copy}`});
  const fields = await getTranslations({locale, namespace: "Email.fields"});
  const url = await absoluteUrl(locale, input.href);
  const greeting = t("greeting", {name: input.user.firstName});
  const text = [
    greeting,
    "",
    t("intro"),
    "",
    t("roomLine", {room: input.roomName}),
    t("timeLine", {time: input.time}),
    t("amountLine", {amount: input.amount}),
    "",
    t("linkLine", {url}),
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
      {label: fields("room"), value: input.roomName},
      {label: fields("time"), value: input.time},
      {label: fields("amount"), value: input.amount},
      {label: fields("link"), value: url, href: url},
    ],
    closing: t("closing"),
  });

  return sendMail({
    to: input.user.email,
    subject: t("subject", {room: input.roomName}),
    text,
    html,
  });
}

function bookingAmount(booking: RoomBooking, locale: string): string {
  return formatChf(minorUnitsToFrancs(booking.amountMinor), locale);
}

function bookingTime(booking: Pick<RoomBooking, "startsAt" | "endsAt">): string {
  return formatZurichRange(booking.startsAt, booking.endsAt);
}

async function sendBookingCopy(
  copy: RoomMailCopy,
  input: {user: User; booking: RoomBooking},
): Promise<MailDelivery> {
  const locale = mailLocale(input.user.locale);
  return sendUserRoomMail({
    user: input.user,
    copy,
    roomName: input.booking.roomName,
    time: bookingTime(input.booking),
    amount: bookingAmount(input.booking, locale),
    href: "/rooms/bookings",
  });
}

export async function sendAdminCreatedRoomBooking(input: {
  user: User;
  booking: RoomBooking;
}): Promise<MailDelivery> {
  return sendBookingCopy("adminCreated", input);
}

export async function sendAdminMovedRoomBooking(input: {
  user: User;
  booking: RoomBooking;
}): Promise<MailDelivery> {
  return sendBookingCopy("adminMoved", input);
}

export async function sendRoomBookingConfirmed(input: {
  user: User;
  booking: RoomBooking;
}): Promise<MailDelivery> {
  return sendBookingCopy("bookingConfirmed", input);
}

export async function sendRoomBookingChanged(input: {
  user: User;
  booking: RoomBooking;
}): Promise<MailDelivery> {
  return sendBookingCopy("bookingChanged", input);
}

export async function sendRoomBookingCancelled(input: {
  user: User;
  booking: RoomBooking;
}): Promise<MailDelivery> {
  return sendBookingCopy("bookingCancelled", input);
}

export async function sendRoomBookingReminder(input: {
  user: User;
  booking: RoomBooking;
}): Promise<MailDelivery> {
  return sendBookingCopy("bookingReminder", input);
}

export async function sendAvailabilityRequestCreated(input: {
  user: User;
  time: string;
  roomName: string | null;
}): Promise<MailDelivery> {
  const locale = mailLocale(input.user.locale);
  const t = await getTranslations({locale, namespace: "Email.requestCreated"});
  const fields = await getTranslations({locale, namespace: "Email.fields"});
  const url = await absoluteUrl(locale, "/rooms/requests");
  const room = input.roomName ?? t("anyRoom");
  const greeting = t("greeting", {name: input.user.firstName});
  const text = [
    greeting,
    "",
    t("intro"),
    "",
    t("roomLine", {room}),
    t("timeLine", {time: input.time}),
    "",
    t("linkLine", {url}),
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
      {label: fields("room"), value: room},
      {label: fields("time"), value: input.time},
      {label: fields("link"), value: url, href: url},
    ],
    closing: t("closing"),
  });
  return sendMail({to: input.user.email, subject: t("subject"), text, html});
}

export async function sendAvailabilityRequestCreatedStaff(input: {
  ownerEmail: string;
  ownerName: string;
  time: string;
  roomName: string | null;
}): Promise<MailDelivery> {
  const locale = mailLocale("fr");
  const t = await getTranslations({locale, namespace: "Email.requestCreatedStaff"});
  const fields = await getTranslations({locale, namespace: "Email.fields"});
  const url = await absoluteUrl(locale, "/admin/requests");
  const room = input.roomName ?? t("anyRoom");
  const text = [
    t("intro"),
    "",
    t("nameLine", {name: input.ownerName}),
    t("emailLine", {email: input.ownerEmail}),
    t("roomLine", {room}),
    t("timeLine", {time: input.time}),
    "",
    t("linkLine", {url}),
  ].join("\n");
  const html = composeTransactionalEmail({
    locale,
    preheader: t("intro"),
    eyebrow: t("eyebrow"),
    title: t("title"),
    intro: t("intro"),
    details: [
      {label: fields("name"), value: input.ownerName},
      {label: fields("email"), value: input.ownerEmail},
      {label: fields("room"), value: room},
      {label: fields("time"), value: input.time},
      {label: fields("link"), value: url, href: url},
    ],
  });
  return sendMail({
    to: organization.email,
    replyTo: input.ownerEmail,
    subject: t("subject"),
    text,
    html,
  });
}

export async function sendAvailabilityRequestDecision(input: {
  user: User;
  decision: "RESOLVED" | "DECLINED";
  time: string;
  roomName: string | null;
}): Promise<MailDelivery> {
  const copy = input.decision === "RESOLVED" ? "requestResolved" : "requestDeclined";
  const locale = mailLocale(input.user.locale);
  const t = await getTranslations({locale, namespace: `Email.${copy}`});
  const fields = await getTranslations({locale, namespace: "Email.fields"});
  const url = await absoluteUrl(locale, "/rooms/requests");
  const room = input.roomName ?? t("anyRoom");
  const greeting = t("greeting", {name: input.user.firstName});
  const text = [
    greeting,
    "",
    t("intro"),
    "",
    t("roomLine", {room}),
    t("timeLine", {time: input.time}),
    "",
    t("linkLine", {url}),
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
      {label: fields("room"), value: room},
      {label: fields("time"), value: input.time},
      {label: fields("link"), value: url, href: url},
    ],
    closing: t("closing"),
  });
  return sendMail({to: input.user.email, subject: t("subject"), text, html});
}

export async function sendStatementFinalizedMail(input: {
  user: User;
  monthLabel: string;
  amount: string;
  minutes: number;
}): Promise<MailDelivery> {
  const locale = mailLocale(input.user.locale);
  const t = await getTranslations({locale, namespace: "Email.statementFinalized"});
  const fields = await getTranslations({locale, namespace: "Email.fields"});
  const url = await absoluteUrl(locale, "/billing");
  const greeting = t("greeting", {name: input.user.firstName});
  const text = [
    greeting,
    "",
    t("intro"),
    "",
    t("monthLine", {month: input.monthLabel}),
    t("minutesLine", {minutes: String(input.minutes)}),
    t("amountLine", {amount: input.amount}),
    "",
    t("linkLine", {url}),
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
      {label: fields("month"), value: input.monthLabel},
      {label: fields("minutes"), value: String(input.minutes)},
      {label: fields("amount"), value: input.amount},
      {label: fields("link"), value: url, href: url},
    ],
    closing: t("closing"),
  });
  return sendMail({
    to: input.user.email,
    subject: t("subject", {month: input.monthLabel}),
    text,
    html,
  });
}

export async function sendStatementPaymentSucceededMail(input: {
  user: User;
  monthLabel: string;
  amount: string;
}): Promise<MailDelivery> {
  const locale = mailLocale(input.user.locale);
  const t = await getTranslations({locale, namespace: "Email.paymentSucceeded"});
  const fields = await getTranslations({locale, namespace: "Email.fields"});
  const url = await absoluteUrl(locale, "/billing");
  const greeting = t("greeting", {name: input.user.firstName});
  const text = [
    greeting,
    "",
    t("intro"),
    "",
    t("monthLine", {month: input.monthLabel}),
    t("amountLine", {amount: input.amount}),
    "",
    t("linkLine", {url}),
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
      {label: fields("month"), value: input.monthLabel},
      {label: fields("amount"), value: input.amount},
      {label: fields("status"), value: fields("statusPaid")},
      {label: fields("link"), value: url, href: url},
    ],
    closing: t("closing"),
  });
  return sendMail({
    to: input.user.email,
    subject: t("subject", {month: input.monthLabel}),
    text,
    html,
  });
}

export async function sendStatementPaymentFailedMail(input: {
  user: User;
  monthLabel: string;
  amount: string;
}): Promise<MailDelivery> {
  const locale = mailLocale(input.user.locale);
  const t = await getTranslations({locale, namespace: "Email.paymentFailed"});
  const fields = await getTranslations({locale, namespace: "Email.fields"});
  const url = await absoluteUrl(locale, "/billing");
  const greeting = t("greeting", {name: input.user.firstName});
  const text = [
    greeting,
    "",
    t("intro"),
    "",
    t("monthLine", {month: input.monthLabel}),
    t("amountLine", {amount: input.amount}),
    "",
    t("linkLine", {url}),
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
      {label: fields("month"), value: input.monthLabel},
      {label: fields("amount"), value: input.amount},
      {label: fields("status"), value: fields("statusFailed")},
      {label: fields("link"), value: url, href: url},
    ],
    closing: t("closing"),
  });
  return sendMail({
    to: input.user.email,
    subject: t("subject", {month: input.monthLabel}),
    text,
    html,
  });
}

"use server";

import {redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {hasLocale} from "next-intl";

import {sendLeadNotification} from "@/features/email/lead-notification";
import {getCourseById, getBookableDates} from "@/features/courses/queries";
import {isCoursePublished} from "@/features/courses/types";
import {getPaymentProvider} from "@/features/payments/get-provider";
import {francsToMinorUnits} from "@/features/payments/money";
import {localizedPathname} from "@/i18n/path";
import {routing, type AppLocale} from "@/i18n/routing";
import {getSiteUrl} from "@/lib/site-url";

import {resolveBookingDate} from "./booking-date";
import {
  attachPaymentReference,
  createPendingBooking,
} from "./repository";
import {
  parseBookingForm,
  readBookingDraft,
  type BookingFormDraft,
  type BookingFormErrors,
} from "./validation";

export type CreateBookingState = {
  errors?: BookingFormErrors;
  draft?: BookingFormDraft;
};

export async function createBookingAction(
  locale: string,
  courseId: string,
  _previous: CreateBookingState | null,
  formData: FormData,
): Promise<CreateBookingState> {
  const resolvedLocale: AppLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "BookingForm.errors",
  });
  const draft = readBookingDraft(formData);
  const parsed = parseBookingForm(formData);
  const values = parsed.values;

  if (parsed.errors || !values) {
    return {
      errors: localizeErrors(parsed.errors ?? {form: "invalid"}, t),
      draft,
    };
  }

  const course = getCourseById(courseId);

  if (!course || !isCoursePublished(course)) {
    return {errors: {form: t("courseMissing")}, draft};
  }

  if (getBookableDates(course).length === 0) {
    return {errors: {form: t("waitlistOnly")}, draft};
  }

  const selectedDate = resolveBookingDate(course, values.courseDateId);

  if (!selectedDate) {
    return {errors: {courseDateId: t("dateUnavailable")}, draft};
  }

  const origin = getSiteUrl().origin;
  const isLead = values.intent === "lead";
  const provider = isLead ? {name: "offline"} : getPaymentProvider();

  const booking = await createPendingBooking({
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    phone: values.phone,
    street: values.street,
    postalCode: values.postalCode,
    city: values.city,
    country: values.country,
    locale: resolvedLocale,
    courseId: course.id,
    courseDateId: selectedDate.id,
    courseTitle: course.title[resolvedLocale],
    courseDateStart: selectedDate.startDate,
    courseDateEnd: selectedDate.endDate,
    location: selectedDate.location[resolvedLocale],
    amountMinor: francsToMinorUnits(course.priceChf),
    currency: "chf",
    paymentProvider: provider.name,
    privacyAcceptedAt: new Date(),
    status: isLead ? "LEAD" : "PENDING",
  });

  if (isLead) {
    try {
      await sendLeadNotification(booking);
    } catch (error) {
      console.error("Failed to send lead notification", error);
    }

    const contactPath = localizedPathname(resolvedLocale, "/contact");
    redirect(`${contactPath}?sent=payment`);
  }

  const checkoutProvider = getPaymentProvider();
  const successPath = localizedPathname(resolvedLocale, "/booking/success");
  const cancelPath = localizedPathname(resolvedLocale, "/booking/cancelled");

  const checkout = await checkoutProvider.createCheckout({
    bookingId: booking.id,
    amountMinor: booking.amountMinor,
    currency: booking.currency,
    customerEmail: booking.email,
    description: `${course.title[resolvedLocale]} — ${selectedDate.location[resolvedLocale]}`,
    successUrl: `${origin}${successPath}?bookingId=${booking.id}`,
    cancelUrl: `${origin}${cancelPath}?bookingId=${booking.id}`,
    locale: resolvedLocale,
  });

  await attachPaymentReference(booking.id, checkout.reference);

  redirect(
    checkout.url.startsWith("http")
      ? checkout.url
      : `${origin}${checkout.url}`,
  );
}

const errorKeys = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "street",
  "postalCode",
  "city",
  "country",
  "courseDateId",
  "privacyAccepted",
  "form",
] as const;

function localizeErrors(
  errors: BookingFormErrors,
  t: (
    key:
      | "firstName"
      | "lastName"
      | "email"
      | "phone"
      | "street"
      | "postalCode"
      | "city"
      | "country"
      | "courseDateId"
      | "privacyAccepted"
      | "invalid",
  ) => string,
): BookingFormErrors {
  const mapped: BookingFormErrors = {};

  for (const key of errorKeys) {
    if (!errors[key]) {
      continue;
    }

    mapped[key] = key === "form" ? t("invalid") : t(key);
  }

  if (Object.keys(mapped).length === 0) {
    mapped.form = t("invalid");
  }

  return mapped;
}

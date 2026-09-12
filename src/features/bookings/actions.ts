"use server";

import {redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {hasLocale} from "next-intl";

import {getBookableDates} from "@/features/courses/queries";
import {loadPublishedCourseById} from "@/features/courses/live";
import {persistCheckoutContact} from "@/features/auth/contact";
import {getCurrentUser} from "@/features/auth/session";
import {sendLeadNotification} from "@/features/email/lead-notification";
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
import {localizeBookingFormErrors} from "./form-errors";
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
      errors: localizeBookingFormErrors(
        parsed.errors ?? {form: "invalid"},
        (key) => t(key as "invalid"),
      ),
      draft,
    };
  }

  const course = await loadPublishedCourseById(courseId);
  if (!course) {
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
  const signedInUser = await getCurrentUser();

  let nextUrl: string;

  try {
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
      userId: signedInUser?.id ?? null,
    });
    await persistCheckoutContact({
      userId: signedInUser?.id,
      email: values.email,
      phone: values.phone,
      street: values.street,
      postalCode: values.postalCode,
      city: values.city,
      country: values.country,
    });

    if (isLead) {
      try {
        await sendLeadNotification(booking);
      } catch (error) {
        console.error("Failed to send lead notification", error);
      }

      const cancelPath = localizedPathname(resolvedLocale, "/booking/cancelled");
      nextUrl = `${cancelPath}?bookingId=${booking.id}&source=other`;
    } else {
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
      nextUrl = checkout.url.startsWith("http")
        ? checkout.url
        : `${origin}${checkout.url}`;
    }
  } catch (error) {
    console.error("Failed to start booking checkout", error);
    return {errors: {form: t("saveFailed")}, draft};
  }

  redirect(nextUrl);
}

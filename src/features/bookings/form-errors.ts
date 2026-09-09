import type {BookingFormErrors} from "./validation";

export const bookingFormIssueKeys = [
  "courseDateId",
  "firstName",
  "lastName",
  "email",
  "phone",
  "street",
  "postalCode",
  "city",
  "country",
  "privacyAccepted",
] as const;

export type BookingFormIssueKey = (typeof bookingFormIssueKeys)[number];

export const bookingIssueLabelKeys = {
  courseDateId: "dateLabel",
  firstName: "firstName",
  lastName: "lastName",
  email: "email",
  phone: "phone",
  street: "street",
  postalCode: "postalCode",
  city: "city",
  country: "country",
  privacyAccepted: "privacyShort",
} as const;

export function localizeBookingFormErrors(
  errors: BookingFormErrors,
  t: (key: string) => string,
): BookingFormErrors {
  const mapped: BookingFormErrors = {};

  for (const key of bookingFormIssueKeys) {
    if (errors[key]) {
      mapped[key] = t(key);
    }
  }

  if (errors.form) {
    mapped.form = t("invalid");
  }

  if (Object.keys(mapped).length === 0) {
    mapped.form = t("invalid");
  }

  return mapped;
}

export function visibleBookingIssueKeys(
  errors: BookingFormErrors,
): BookingFormIssueKey[] {
  return bookingFormIssueKeys.filter((key) => Boolean(errors[key]));
}

export function bookingIssueLabelKey(
  key: BookingFormIssueKey,
): (typeof bookingIssueLabelKeys)[BookingFormIssueKey] {
  return bookingIssueLabelKeys[key];
}

export function bookingIssueElementId(key: BookingFormIssueKey): string {
  if (key === "courseDateId") {
    return "booking-date";
  }

  return key;
}

export function focusBookingIssue(key: BookingFormIssueKey): void {
  const element = document.getElementById(bookingIssueElementId(key));

  if (!(element instanceof HTMLElement)) {
    return;
  }

  element.scrollIntoView({block: "center", behavior: "smooth"});
  element.focus();
}

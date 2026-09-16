import {pickFilled} from "@/shared/pick-filled";
import {
  clearSessionDraft,
  clearSessionDraftsByPrefix,
  readSessionDraft,
  writeSessionDraft,
  type SessionDraftStorage,
} from "@/shared/session-draft";

import {readBookingDraft, type BookingFormDraft} from "./validation";

export {pickFilled};

export const BOOKING_FORM_DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const BOOKING_FORM_DRAFT_SCOPE_PREFIX = "booking-form:";
const LAST_BOOKING_CONTACT_SCOPE = "booking-contact";

export type BookingSessionDraft = BookingFormDraft & {
  privacyAccepted: boolean;
};

export type BookingContactPrefill = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
};

const stringFields = [
  "firstName",
  "lastName",
  "dateOfBirth",
  "email",
  "phone",
  "street",
  "postalCode",
  "city",
  "country",
  "courseDateId",
] as const;

const stringLimits: Record<(typeof stringFields)[number], number> = {
  firstName: 80,
  lastName: 80,
  dateOfBirth: 10,
  email: 160,
  phone: 40,
  street: 120,
  postalCode: 12,
  city: 80,
  country: 56,
  courseDateId: 200,
};

export function bookingFormDraftScope(courseId: string): string {
  return `${BOOKING_FORM_DRAFT_SCOPE_PREFIX}${courseId}`;
}

export function isBookingSessionDraft(
  value: unknown,
): value is BookingSessionDraft {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.privacyAccepted !== "boolean") {
    return false;
  }

  return stringFields.every((field) => typeof record[field] === "string");
}

export function bookingSessionDraftFromFormData(
  formData: FormData,
): BookingSessionDraft {
  const privacyRaw = formData.get("privacyAccepted");

  return sanitizeBookingSessionDraft({
    ...readBookingDraft(formData),
    privacyAccepted:
      privacyRaw === "on" || privacyRaw === "true" || privacyRaw === "1",
  });
}

export function readBookingFormDraft(
  courseId: string,
  options: {
    now?: () => number;
    storage?: SessionDraftStorage | null;
  } = {},
): BookingSessionDraft | null {
  const draft = readSessionDraft(bookingFormDraftScope(courseId), isBookingSessionDraft, {
    maxAgeMs: BOOKING_FORM_DRAFT_MAX_AGE_MS,
    ...options,
  });

  return draft ? sanitizeBookingSessionDraft(draft) : null;
}

export function writeBookingFormDraft(
  courseId: string,
  draft: BookingSessionDraft,
  options: {
    now?: () => number;
    storage?: SessionDraftStorage | null;
  } = {},
): void {
  writeSessionDraft(bookingFormDraftScope(courseId), sanitizeBookingSessionDraft(draft), options);
  writeLastBookingContact(draft, options);
}

export function clearBookingFormDraft(
  courseId: string,
  storage?: SessionDraftStorage | null,
): void {
  clearSessionDraft(bookingFormDraftScope(courseId), storage);
}

export function clearAllBookingFormDrafts(
  storage?: SessionDraftStorage | null,
): void {
  clearSessionDraftsByPrefix(BOOKING_FORM_DRAFT_SCOPE_PREFIX, storage);
}

const contactFields = [
  "firstName",
  "lastName",
  "dateOfBirth",
  "email",
  "phone",
  "street",
  "postalCode",
  "city",
  "country",
] as const;

export function isBookingContactPrefill(
  value: unknown,
): value is BookingContactPrefill {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return contactFields.every((field) => typeof record[field] === "string");
}

export function hasBookingContactPrefill(
  contact: BookingContactPrefill | null | undefined,
): contact is BookingContactPrefill {
  if (!contact) {
    return false;
  }

  return Boolean(
    pickFilled(
      contact.firstName,
      contact.lastName,
      contact.dateOfBirth,
      contact.email,
      contact.phone,
      contact.street,
      contact.postalCode,
      contact.city,
      contact.country,
    ),
  );
}

export function bookingContactFromDraft(
  draft: Pick<BookingFormDraft, keyof BookingContactPrefill>,
): BookingContactPrefill {
  return {
    firstName: draft.firstName.slice(0, stringLimits.firstName),
    lastName: draft.lastName.slice(0, stringLimits.lastName),
    dateOfBirth: draft.dateOfBirth.slice(0, stringLimits.dateOfBirth),
    email: draft.email.slice(0, stringLimits.email),
    phone: draft.phone.slice(0, stringLimits.phone),
    street: draft.street.slice(0, stringLimits.street),
    postalCode: draft.postalCode.slice(0, stringLimits.postalCode),
    city: draft.city.slice(0, stringLimits.city),
    country: draft.country.slice(0, stringLimits.country),
  };
}

export function readLastBookingContact(
  options: {
    now?: () => number;
    storage?: SessionDraftStorage | null;
  } = {},
): BookingContactPrefill | null {
  const contact = readSessionDraft(LAST_BOOKING_CONTACT_SCOPE, isBookingContactPrefill, {
    maxAgeMs: BOOKING_FORM_DRAFT_MAX_AGE_MS,
    ...options,
  });

  return contact && hasBookingContactPrefill(contact)
    ? bookingContactFromDraft(contact)
    : null;
}

export function writeLastBookingContact(
  next: Partial<BookingContactPrefill>,
  options: {
    now?: () => number;
    storage?: SessionDraftStorage | null;
  } = {},
): void {
  const previous = readLastBookingContact(options);
  const merged = bookingContactFromDraft({
    firstName: pickFilled(next.firstName, previous?.firstName) ?? "",
    lastName: pickFilled(next.lastName, previous?.lastName) ?? "",
    dateOfBirth: pickFilled(next.dateOfBirth, previous?.dateOfBirth) ?? "",
    email: pickFilled(next.email, previous?.email) ?? "",
    phone: pickFilled(next.phone, previous?.phone) ?? "",
    street: pickFilled(next.street, previous?.street) ?? "",
    postalCode: pickFilled(next.postalCode, previous?.postalCode) ?? "",
    city: pickFilled(next.city, previous?.city) ?? "",
    country: pickFilled(next.country, previous?.country) ?? "",
  });

  if (!hasBookingContactPrefill(merged)) {
    return;
  }

  writeSessionDraft(LAST_BOOKING_CONTACT_SCOPE, merged, options);
}

function sanitizeBookingSessionDraft(
  draft: BookingSessionDraft,
): BookingSessionDraft {
  return {
    firstName: draft.firstName.slice(0, stringLimits.firstName),
    lastName: draft.lastName.slice(0, stringLimits.lastName),
    dateOfBirth: draft.dateOfBirth.slice(0, stringLimits.dateOfBirth),
    email: draft.email.slice(0, stringLimits.email),
    phone: draft.phone.slice(0, stringLimits.phone),
    street: draft.street.slice(0, stringLimits.street),
    postalCode: draft.postalCode.slice(0, stringLimits.postalCode),
    city: draft.city.slice(0, stringLimits.city),
    country: draft.country.slice(0, stringLimits.country),
    courseDateId: draft.courseDateId.slice(0, stringLimits.courseDateId),
    privacyAccepted: draft.privacyAccepted,
  };
}

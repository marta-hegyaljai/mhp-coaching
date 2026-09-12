import type {User} from "@/db/schema";
import {normalizeEmail} from "@/features/auth/email";
import {findUserById, findUserByNormalizedEmail, updateUser} from "@/features/auth/repository";
import {findLatestBookingForEmail} from "@/features/bookings/repository";

export type UserContact = {
  phone: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
};

export type CheckoutContact = {
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
};

const PHONE_PATTERN = /^[0-9+().\s-]+$/;

export function emptyToNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function checkoutDefaultsFromUser(user: Pick<
  User,
  "firstName" | "lastName" | "email" | "phone" | "street" | "postalCode" | "city" | "country"
>): {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  country?: string;
} {
  const contact = contactFromUser(user);
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    ...(contact.phone ? {phone: contact.phone} : {}),
    ...(contact.street ? {street: contact.street} : {}),
    ...(contact.postalCode ? {postalCode: contact.postalCode} : {}),
    ...(contact.city ? {city: contact.city} : {}),
    ...(contact.country ? {country: contact.country} : {}),
  };
}

export function contactFromUser(user: Pick<User, keyof UserContact>): UserContact {
  return {
    phone: emptyToNull(user.phone),
    street: emptyToNull(user.street),
    postalCode: emptyToNull(user.postalCode),
    city: emptyToNull(user.city),
    country: emptyToNull(user.country),
  };
}

export function optionalContactErrors(input: {
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
}): Partial<Record<keyof CheckoutContact, true>> {
  const errors: Partial<Record<keyof CheckoutContact, true>> = {};
  const phone = input.phone.trim();
  const street = input.street.trim();
  const postalCode = input.postalCode.trim();
  const city = input.city.trim();
  const country = input.country.trim();

  if (phone && (phone.length < 7 || phone.length > 40 || !PHONE_PATTERN.test(phone))) {
    errors.phone = true;
  }
  if (street && (street.length < 3 || street.length > 120)) {
    errors.street = true;
  }
  if (postalCode && (postalCode.length < 3 || postalCode.length > 12)) {
    errors.postalCode = true;
  }
  if (city && (city.length < 2 || city.length > 80)) {
    errors.city = true;
  }
  if (country && (country.length < 2 || country.length > 56)) {
    errors.country = true;
  }

  return errors;
}

export function parseOptionalContact(input: {
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
}): {ok: true; contact: UserContact} | {ok: false; fieldErrors: Partial<Record<keyof CheckoutContact, true>>} {
  const fieldErrors = optionalContactErrors(input);
  if (Object.keys(fieldErrors).length > 0) {
    return {ok: false, fieldErrors};
  }

  return {
    ok: true,
    contact: {
      phone: emptyToNull(input.phone),
      street: emptyToNull(input.street),
      postalCode: emptyToNull(input.postalCode),
      city: emptyToNull(input.city),
      country: emptyToNull(input.country),
    },
  };
}

function contactChanged(user: User, next: UserContact): boolean {
  const current = contactFromUser(user);
  return (
    current.phone !== next.phone ||
    current.street !== next.street ||
    current.postalCode !== next.postalCode ||
    current.city !== next.city ||
    current.country !== next.country
  );
}

export async function persistCheckoutContact(input: {
  userId?: string | null;
  email: string;
  phone?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  country?: string;
}): Promise<void> {
  const user = input.userId
    ? await findUserById(input.userId)
    : await findUserByNormalizedEmail(normalizeEmail(input.email));

  if (!user) {
    return;
  }

  const next: UserContact = {
    phone: emptyToNull(input.phone) ?? emptyToNull(user.phone),
    street: emptyToNull(input.street) ?? emptyToNull(user.street),
    postalCode: emptyToNull(input.postalCode) ?? emptyToNull(user.postalCode),
    city: emptyToNull(input.city) ?? emptyToNull(user.city),
    country: emptyToNull(input.country) ?? emptyToNull(user.country),
  };

  if (emptyToNull(input.phone)) {
    next.phone = emptyToNull(input.phone);
  }
  if (emptyToNull(input.street)) {
    next.street = emptyToNull(input.street);
  }
  if (emptyToNull(input.postalCode)) {
    next.postalCode = emptyToNull(input.postalCode);
  }
  if (emptyToNull(input.city)) {
    next.city = emptyToNull(input.city);
  }
  if (emptyToNull(input.country)) {
    next.country = emptyToNull(input.country);
  }

  if (!contactChanged(user, next)) {
    return;
  }

  await updateUser(user.id, next);
}

export async function hydrateUserContactFromBookings(user: User): Promise<User> {
  const current = contactFromUser(user);
  if (current.phone && current.street && current.postalCode && current.city && current.country) {
    return user;
  }

  const booking = await findLatestBookingForEmail(user.emailNormalized);
  if (!booking) {
    return user;
  }

  const next: UserContact = {
    phone: current.phone ?? emptyToNull(booking.phone),
    street: current.street ?? emptyToNull(booking.street),
    postalCode: current.postalCode ?? emptyToNull(booking.postalCode),
    city: current.city ?? emptyToNull(booking.city),
    country: current.country ?? emptyToNull(booking.country),
  };

  if (!contactChanged(user, next)) {
    return user;
  }

  return updateUser(user.id, next);
}

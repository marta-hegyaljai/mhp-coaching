import type {User} from "@/db/schema";
import {normalizeEmail} from "@/features/auth/email";
import {findUserById, findUserByNormalizedEmail, updateUser} from "@/features/auth/repository";
import {findLatestBookingForPerson} from "@/features/bookings/repository";
import {pickFilled} from "@/shared/pick-filled";

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

export type CheckoutDefaults = {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  phone?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  country?: string;
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
>): CheckoutDefaults {
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

export function checkoutDefaultsFromBooking(booking: {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string | null;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
}): CheckoutDefaults {
  return {
    firstName: booking.firstName,
    lastName: booking.lastName,
    email: booking.email,
    ...(emptyToNull(booking.dateOfBirth) ? {dateOfBirth: booking.dateOfBirth ?? undefined} : {}),
    ...(emptyToNull(booking.phone) ? {phone: booking.phone} : {}),
    ...(emptyToNull(booking.street) ? {street: booking.street} : {}),
    ...(emptyToNull(booking.city) ? {city: booking.city} : {}),
    ...(emptyToNull(booking.postalCode) ? {postalCode: booking.postalCode} : {}),
    ...(emptyToNull(booking.country) ? {country: booking.country} : {}),
  };
}

export function mergeCheckoutDefaults(
  ...sources: Array<CheckoutDefaults | undefined>
): CheckoutDefaults | undefined {
  const defined = sources.filter((source): source is CheckoutDefaults => Boolean(source));
  if (defined.length === 0) {
    return undefined;
  }

  function fromSources(read: (source: CheckoutDefaults) => string | undefined) {
    return pickFilled(...defined.map(read));
  }

  return {
    firstName: fromSources((source) => source.firstName) ?? "",
    lastName: fromSources((source) => source.lastName) ?? "",
    email: fromSources((source) => source.email) ?? "",
    ...(fromSources((source) => source.dateOfBirth)
      ? {dateOfBirth: fromSources((source) => source.dateOfBirth)}
      : {}),
    ...(fromSources((source) => source.phone) ? {phone: fromSources((source) => source.phone)} : {}),
    ...(fromSources((source) => source.street)
      ? {street: fromSources((source) => source.street)}
      : {}),
    ...(fromSources((source) => source.postalCode)
      ? {postalCode: fromSources((source) => source.postalCode)}
      : {}),
    ...(fromSources((source) => source.city) ? {city: fromSources((source) => source.city)} : {}),
    ...(fromSources((source) => source.country)
      ? {country: fromSources((source) => source.country)}
      : {}),
  };
}

export async function resolveCheckoutDefaults(
  user: User | null,
): Promise<CheckoutDefaults | undefined> {
  if (!user) {
    return undefined;
  }

  const hydrated = await hydrateUserContactFromBookings(user);
  const booking = await findLatestBookingForPerson({
    emailNormalized: hydrated.emailNormalized,
    userId: hydrated.id,
  });

  return mergeCheckoutDefaults(
    checkoutDefaultsFromUser(hydrated),
    booking ? checkoutDefaultsFromBooking(booking) : undefined,
  );
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

  const booking = await findLatestBookingForPerson({
    emailNormalized: user.emailNormalized,
    userId: user.id,
  });
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

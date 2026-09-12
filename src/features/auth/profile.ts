import type {User} from "@/db/schema";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {type UserContact, contactFromUser} from "@/features/auth/contact";
import {isValidPersonName, trimPersonName} from "@/features/auth/person-name";
import {recordAudit, updateUser} from "@/features/auth/repository";
import {routing, type AppLocale} from "@/i18n/routing";

export type ProfileFieldError = "firstName" | "lastName" | "locale";

export type UpdateProfileInput = {
  user: User;
  firstName: string;
  lastName: string;
  locale: string;
  contact?: UserContact;
};

export type UpdateProfileResult =
  | {ok: false; fieldErrors: Partial<Record<ProfileFieldError, true>>}
  | {ok: true; user: User};

function isAppLocale(value: string): value is AppLocale {
  return (routing.locales as readonly string[]).includes(value);
}

function emptyContact(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export async function updateAccountProfile(
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  const firstName = trimPersonName(input.firstName);
  const lastName = trimPersonName(input.lastName);
  const fieldErrors: Partial<Record<ProfileFieldError, true>> = {};

  if (!isValidPersonName(firstName)) {
    fieldErrors.firstName = true;
  }
  if (!isValidPersonName(lastName)) {
    fieldErrors.lastName = true;
  }
  if (!isAppLocale(input.locale)) {
    fieldErrors.locale = true;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {ok: false, fieldErrors};
  }

  const locale = input.locale as AppLocale;
  const contact = input.contact ?? contactFromUser(input.user);
  const profileChanged =
    firstName !== input.user.firstName ||
    lastName !== input.user.lastName ||
    locale !== input.user.locale ||
    contact.phone !== emptyContact(input.user.phone) ||
    contact.street !== emptyContact(input.user.street) ||
    contact.postalCode !== emptyContact(input.user.postalCode) ||
    contact.city !== emptyContact(input.user.city) ||
    contact.country !== emptyContact(input.user.country);

  if (!profileChanged) {
    return {ok: true, user: input.user};
  }

  const user = await updateUser(input.user.id, {
    firstName,
    lastName,
    locale,
    phone: contact.phone,
    street: contact.street,
    postalCode: contact.postalCode,
    city: contact.city,
    country: contact.country,
  });
  await recordAudit({
    actorUserId: input.user.id,
    targetUserId: input.user.id,
    action: AUDIT_ACTIONS.PROFILE_UPDATED,
    before: {
      firstName: input.user.firstName,
      lastName: input.user.lastName,
      locale: input.user.locale,
      phone: input.user.phone,
      street: input.user.street,
      postalCode: input.user.postalCode,
      city: input.user.city,
      country: input.user.country,
    },
    after: {
      firstName,
      lastName,
      locale,
      phone: contact.phone,
      street: contact.street,
      postalCode: contact.postalCode,
      city: contact.city,
      country: contact.country,
    },
  });

  return {ok: true, user};
}

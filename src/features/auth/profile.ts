import type {User} from "@/db/schema";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {isValidPersonName, trimPersonName} from "@/features/auth/person-name";
import {recordAudit, updateUser} from "@/features/auth/repository";
import {routing, type AppLocale} from "@/i18n/routing";

export type ProfileFieldError = "firstName" | "lastName" | "locale";

export type UpdateProfileInput = {
  user: User;
  firstName: string;
  lastName: string;
  locale: string;
};

export type UpdateProfileResult =
  | {ok: false; fieldErrors: Partial<Record<ProfileFieldError, true>>}
  | {ok: true; user: User};

function isAppLocale(value: string): value is AppLocale {
  return (routing.locales as readonly string[]).includes(value);
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
  const profileChanged =
    firstName !== input.user.firstName ||
    lastName !== input.user.lastName ||
    locale !== input.user.locale;

  if (!profileChanged) {
    return {ok: true, user: input.user};
  }

  const user = await updateUser(input.user.id, {firstName, lastName, locale});
  await recordAudit({
    actorUserId: input.user.id,
    targetUserId: input.user.id,
    action: AUDIT_ACTIONS.PROFILE_UPDATED,
    before: {
      firstName: input.user.firstName,
      lastName: input.user.lastName,
      locale: input.user.locale,
    },
    after: {firstName, lastName, locale},
  });

  return {ok: true, user};
}

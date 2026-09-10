"use server";

import {revalidatePath} from "next/cache";
import {getTranslations} from "next-intl/server";
import {hasLocale} from "next-intl";

import {
  AccessControlError,
  inviteUser,
  setUserAdmin,
  setUserDisabled,
  setUserRoomBooking,
} from "@/features/admin/access";
import {canAdminister} from "@/features/auth/policy";
import {readSessionUser} from "@/features/auth/session";
import {routing, type AppLocale} from "@/i18n/routing";

export type AdminFormState = {
  ok?: boolean;
  error?: string;
};

function resolveLocale(locale: string): AppLocale {
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

async function requireAdminActor() {
  const actor = await readSessionUser();

  if (!actor || !canAdminister(actor)) {
    throw new AccessControlError("forbidden");
  }

  return actor;
}

function localizeAccessError(
  error: unknown,
  t: (key: "forbidden" | "invalidEmail" | "invalidName" | "alreadyRegistered" | "notFound" | "cannotDisableSelf" | "cannotDemoteLastAdmin" | "sendFailed") => string,
): AdminFormState {
  if (error instanceof AccessControlError) {
    return {error: t(error.code)};
  }
  console.error(error);
  return {error: t("sendFailed")};
}

export async function inviteUserAction(
  locale: string,
  _previous: AdminFormState | null,
  formData: FormData,
): Promise<AdminFormState> {
  const resolvedLocale = resolveLocale(locale);

  try {
    const actor = await requireAdminActor();
    await inviteUser({
      actor,
      email: String(formData.get("email") ?? ""),
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      locale: resolvedLocale,
      isAdmin: formData.get("isAdmin") === "on",
      roomBookingEnabled: formData.get("roomBookingEnabled") === "on",
    });
    revalidatePath(`/${resolvedLocale}/admin/users`);
    return {ok: true};
  } catch (error) {
    const t = await getTranslations({
      locale: resolvedLocale,
      namespace: "Admin.errors",
    });
    return localizeAccessError(error, t);
  }
}

export async function updateUserAccessAction(
  locale: string,
  userId: string,
  _previous: AdminFormState | null,
  formData: FormData,
): Promise<AdminFormState> {
  const resolvedLocale = resolveLocale(locale);

  try {
    const actor = await requireAdminActor();
    const intent = String(formData.get("intent") ?? "");

    if (intent === "disable") {
      await setUserDisabled({actor, targetUserId: userId, disabled: true});
    } else if (intent === "enable") {
      await setUserDisabled({actor, targetUserId: userId, disabled: false});
    } else if (intent === "resend") {
      const firstName = String(formData.get("firstName") ?? "");
      const lastName = String(formData.get("lastName") ?? "");
      const email = String(formData.get("email") ?? "");
      await inviteUser({
        actor,
        email,
        firstName,
        lastName,
        locale: resolvedLocale,
        isAdmin: formData.get("isAdmin") === "on",
        roomBookingEnabled: formData.get("roomBookingEnabled") === "on",
      });
    } else {
      await setUserAdmin({
        actor,
        targetUserId: userId,
        isAdmin: formData.get("isAdmin") === "on",
      });
      await setUserRoomBooking({
        actor,
        targetUserId: userId,
        enabled: formData.get("roomBookingEnabled") === "on",
      });
    }

    revalidatePath(`/${resolvedLocale}/admin/users`);
    revalidatePath(`/${resolvedLocale}/admin/users/${userId}`);
    return {ok: true};
  } catch (error) {
    const t = await getTranslations({
      locale: resolvedLocale,
      namespace: "Admin.errors",
    });
    return localizeAccessError(error, t);
  }
}

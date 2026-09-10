"use server";

import {redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {hasLocale} from "next-intl";

import {canAuthenticate} from "@/features/auth/policy";
import {passwordErrors, hashPassword, verifyPassword} from "@/features/auth/password";
import {isValidEmail, normalizeEmail} from "@/features/auth/email";
import {
  isInviteAcceptRateLimited,
  isSignInRateLimited,
  recordInviteAcceptAttempt,
  recordSignInAttempt,
} from "@/features/auth/rate-limit";
import {safeInternalPath} from "@/features/auth/redirect-path";
import {
  AUDIT_ACTIONS,
  accessSnapshot,
  findUserById,
  findUserByNormalizedEmail,
  findValidInviteToken,
  markInviteConsumed,
  recordAudit,
  updateUser,
} from "@/features/auth/repository";
import {clearSessionCookie, createSessionCookie} from "@/features/auth/session";
import {hashToken} from "@/features/auth/tokens";
import {localizedPathname} from "@/i18n/path";
import {routing, type AppLocale} from "@/i18n/routing";

export type AuthFormState = {
  error?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
    passwordConfirm?: string;
  };
};

function resolveLocale(locale: string): AppLocale {
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

async function dummyPasswordCheck(): Promise<void> {
  await verifyPassword("timing-protection", "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
}

export async function signInAction(
  locale: string,
  nextPath: string,
  _previous: AuthFormState | null,
  formData: FormData,
): Promise<AuthFormState> {
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({locale: resolvedLocale, namespace: "Auth.errors"});
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const destination = safeInternalPath(nextPath, resolvedLocale);

  if (!isValidEmail(email) || password.length === 0) {
    return {error: t("invalid")};
  }

  const emailNormalized = normalizeEmail(email);

  if (await isSignInRateLimited(emailNormalized)) {
    return {error: t("rateLimited")};
  }

  await recordSignInAttempt(emailNormalized);
  const user = await findUserByNormalizedEmail(emailNormalized);

  if (!user || !user.passwordHash) {
    await dummyPasswordCheck();
    return {error: t("invalid")};
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);

  if (!passwordOk) {
    return {error: t("invalid")};
  }

  if (user.disabledAt) {
    return {error: t("disabled")};
  }

  if (!canAuthenticate(user)) {
    return {error: t("invalid")};
  }

  await createSessionCookie(user.id);
  redirect(destination);
}

export async function signOutAction(locale: string): Promise<void> {
  const resolvedLocale = resolveLocale(locale);
  await clearSessionCookie();
  redirect(localizedPathname(resolvedLocale, "/sign-in"));
}

export async function acceptInviteAction(
  locale: string,
  token: string,
  _previous: AuthFormState | null,
  formData: FormData,
): Promise<AuthFormState> {
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({locale: resolvedLocale, namespace: "Auth.errors"});

  if (await isInviteAcceptRateLimited()) {
    return {error: t("rateLimited")};
  }

  await recordInviteAcceptAttempt();

  const invite = await findValidInviteToken(hashToken(token));

  if (!invite) {
    return {error: t("inviteInvalid")};
  }

  const user = await findUserById(invite.userId);

  if (!user || user.disabledAt) {
    return {error: t("inviteInvalid")};
  }

  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const issues = passwordErrors(password, passwordConfirm, user.email);

  if (issues.length > 0) {
    const fieldErrors: AuthFormState["fieldErrors"] = {};
    if (issues.includes("tooShort") || issues.includes("tooLong") || issues.includes("sameAsEmail")) {
      fieldErrors.password = issues.includes("sameAsEmail")
        ? t("passwordSameAsEmail")
        : t("passwordTooShort");
    }
    if (issues.includes("mismatch")) {
      fieldErrors.passwordConfirm = t("passwordMismatch");
    }
    return {fieldErrors};
  }

  const passwordHash = await hashPassword(password);
  const before = accessSnapshot(user);
  const updated = await updateUser(user.id, {
    passwordHash,
    emailVerifiedAt: new Date(),
  });
  await markInviteConsumed(invite.id);
  await recordAudit({
    actorUserId: user.id,
    targetUserId: user.id,
    action: AUDIT_ACTIONS.USER_ACTIVATED,
    before,
    after: accessSnapshot(updated),
  });
  await createSessionCookie(user.id);
  redirect(
    localizedPathname(
      resolvedLocale,
      updated.isAdmin ? "/admin/users" : updated.roomBookingEnabled ? "/rooms" : "/",
    ),
  );
}

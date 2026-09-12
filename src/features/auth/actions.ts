"use server";

import {redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {hasLocale} from "next-intl";

import {linkUnownedBookingsForVerifiedUser} from "@/features/account/link-bookings";
import {canAuthenticate} from "@/features/auth/policy";
import {passwordErrors, hashPassword, verifyPassword} from "@/features/auth/password";
import {isValidEmail, normalizeEmail} from "@/features/auth/email";
import {parseOptionalContact} from "@/features/auth/contact";
import {updateAccountProfile} from "@/features/auth/profile";
import {
  isInviteAcceptRateLimited,
  isRecoveryRateLimited,
  isSignInRateLimited,
  isSignUpRateLimited,
  isVerifyRateLimited,
  recordInviteAcceptAttempt,
  recordRecoveryAttempt,
  recordSignInAttempt,
  recordSignUpAttempt,
  recordVerifyAttempt,
} from "@/features/auth/rate-limit";
import {safeInternalPath} from "@/features/auth/redirect-path";
import {changeSignedInPassword, requestPasswordReset, resetPasswordWithToken} from "@/features/auth/recovery";
import {registerAccount, verifySignupEmail} from "@/features/auth/register";
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
import {
  clearSessionCookie,
  createSessionCookie,
  readActiveSession,
} from "@/features/auth/session";
import {signedInHomeHref, signedInHomePath} from "@/features/auth/signed-in-home";
import {hashToken} from "@/features/auth/tokens";
import {sendEmailVerification, sendPasswordRecovery} from "@/features/email/account";
import {localizedPathname} from "@/i18n/path";
import {routing, type AppLocale} from "@/i18n/routing";

export type AuthFormState = {
  error?: string;
  notice?: string;
  formKey?: string;
  values?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };
  fieldErrors?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    locale?: string;
    currentPassword?: string;
    password?: string;
    passwordConfirm?: string;
    phone?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };
};

function resolveLocale(locale: string): AppLocale {
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

async function dummyPasswordCheck(): Promise<void> {
  await verifyPassword("timing-protection", "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
}

function passwordFieldErrors(
  issues: ReturnType<typeof passwordErrors>,
  t: (key: "passwordTooShort" | "passwordMismatch" | "passwordSameAsEmail") => string,
): AuthFormState["fieldErrors"] {
  const fieldErrors: AuthFormState["fieldErrors"] = {};
  if (issues.includes("tooShort") || issues.includes("tooLong") || issues.includes("sameAsEmail")) {
    fieldErrors.password = issues.includes("sameAsEmail")
      ? t("passwordSameAsEmail")
      : t("passwordTooShort");
  }
  if (issues.includes("mismatch")) {
    fieldErrors.passwordConfirm = t("passwordMismatch");
  }
  return fieldErrors;
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
  const localeHome = `/${resolvedLocale}`;
  let destinationHref: string | null = null;

  try {
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
      return {error: t("unverified")};
    }

    await createSessionCookie(user.id);
    destinationHref =
      destination === localeHome
        ? localizedPathname(resolvedLocale, signedInHomePath(user))
        : destination;
  } catch (error) {
    console.error("Sign-in failed", error);
    return {error: t("unavailable")};
  }

  if (!destinationHref) {
    return {error: t("unavailable")};
  }

  redirect(destinationHref);
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
    return {fieldErrors: passwordFieldErrors(issues, t)};
  }

  const passwordHash = await hashPassword(password);
  const before = accessSnapshot(user);
  const updated = await updateUser(user.id, {
    passwordHash,
    emailVerifiedAt: new Date(),
  });
  await markInviteConsumed(invite.id);
  await linkUnownedBookingsForVerifiedUser(updated);
  await recordAudit({
    actorUserId: user.id,
    targetUserId: user.id,
    action: AUDIT_ACTIONS.USER_ACTIVATED,
    before,
    after: accessSnapshot(updated),
  });
  await createSessionCookie(user.id);
  redirect(localizedPathname(resolvedLocale, signedInHomePath(updated)));
}

function readSignupValues(formData: FormData): NonNullable<AuthFormState["values"]> {
  return {
    firstName: String(formData.get("firstName") ?? "").slice(0, 80),
    lastName: String(formData.get("lastName") ?? "").slice(0, 80),
    email: String(formData.get("email") ?? "").slice(0, 160),
  };
}

export async function signUpAction(
  locale: string,
  _previous: AuthFormState | null,
  formData: FormData,
): Promise<AuthFormState> {
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({locale: resolvedLocale, namespace: "Auth.errors"});
  const auth = await getTranslations({locale: resolvedLocale, namespace: "Auth"});
  const values = readSignupValues(formData);
  const email = values.email ?? "";
  const emailNormalized = isValidEmail(email) ? normalizeEmail(email) : "invalid";
  const formKey = String(Date.now());

  if (await isSignUpRateLimited(emailNormalized)) {
    return {error: t("rateLimited"), values, formKey};
  }

  await recordSignUpAttempt(emailNormalized);

  const result = await registerAccount({
    firstName: values.firstName ?? "",
    lastName: values.lastName ?? "",
    email,
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
    locale: resolvedLocale,
  });

  if (!result.ok) {
    const fieldErrors: AuthFormState["fieldErrors"] = {};
    if (result.fieldErrors.firstName) {
      fieldErrors.firstName = t("nameRequired");
    }
    if (result.fieldErrors.lastName) {
      fieldErrors.lastName = t("nameRequired");
    }
    if (result.fieldErrors.email) {
      fieldErrors.email = t("emailInvalid");
    }
    if (result.fieldErrors.password) {
      fieldErrors.password = t("passwordTooShort");
    }
    if (result.fieldErrors.passwordConfirm) {
      fieldErrors.passwordConfirm = t("passwordMismatch");
    }
    if (result.fieldErrors.password && passwordErrors(
      String(formData.get("password") ?? ""),
      String(formData.get("passwordConfirm") ?? ""),
      email,
    ).includes("sameAsEmail")) {
      fieldErrors.password = t("passwordSameAsEmail");
    }
    return {
      error: auth("passwordNotSaved"),
      fieldErrors,
      values,
      formKey,
    };
  }

  if (result.outcome === "already_registered") {
    return {error: t("alreadyRegistered"), values, formKey};
  }
  if (result.outcome === "disabled") {
    return {error: t("disabled"), values, formKey};
  }
  if (result.outcome === "invite_pending") {
    return {error: t("invitePending"), values, formKey};
  }

  if (result.outcome === "created" || result.outcome === "resent") {
    if (await isVerifyRateLimited(result.user.emailNormalized)) {
      return {error: t("rateLimited"), values, formKey};
    }
    await recordVerifyAttempt(result.user.emailNormalized);
    try {
      await sendEmailVerification({
        to: result.user.email,
        firstName: result.user.firstName,
        locale: resolveLocale(result.user.locale),
        rawToken: result.rawToken,
      });
    } catch (error) {
      console.error("Failed to send verification email", error);
      return {error: t("verificationSendFailed"), values, formKey};
    }

    return {
      notice: auth("confirmEmailSent", {email: result.user.email}),
      values: {email: result.user.email},
    };
  }

  return {error: t("unavailable"), values, formKey};
}

export async function verifyEmailAction(
  locale: string,
  token: string,
  _previous: AuthFormState | null,
  _formData: FormData,
): Promise<AuthFormState> {
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({locale: resolvedLocale, namespace: "Auth.errors"});
  const result = await verifySignupEmail(token);

  if (!result.ok) {
    return {error: t("verifyInvalid")};
  }

  await createSessionCookie(result.user.id);
  redirect(
    localizedPathname(resolvedLocale, signedInHomeHref(result.user, {verified: true})),
  );
}

export async function forgotPasswordAction(
  locale: string,
  _previous: AuthFormState | null,
  formData: FormData,
): Promise<AuthFormState> {
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({locale: resolvedLocale, namespace: "Auth.errors"});
  const auth = await getTranslations({locale: resolvedLocale, namespace: "Auth"});
  const email = String(formData.get("email") ?? "");
  const emailNormalized = isValidEmail(email) ? normalizeEmail(email) : "invalid";

  if (await isRecoveryRateLimited(emailNormalized)) {
    return {error: t("rateLimited")};
  }

  await recordRecoveryAttempt(emailNormalized);
  await dummyPasswordCheck();

  const result = await requestPasswordReset(email);
  if (result.rawToken && result.user) {
    try {
      await sendPasswordRecovery({
        to: result.user.email,
        firstName: result.user.firstName,
        locale: resolveLocale(result.user.locale),
        rawToken: result.rawToken,
      });
    } catch (error) {
      console.error("Failed to send recovery email", error);
    }
  }

  return {notice: auth("forgotNotice")};
}

export async function resetPasswordAction(
  locale: string,
  token: string,
  _previous: AuthFormState | null,
  formData: FormData,
): Promise<AuthFormState> {
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({locale: resolvedLocale, namespace: "Auth.errors"});
  const result = await resetPasswordWithToken({
    rawToken: token,
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
  });

  if (!result.ok && result.reason === "password") {
    return {fieldErrors: passwordFieldErrors(result.issues, t)};
  }

  if (!result.ok) {
    return {error: t("resetInvalid")};
  }

  await createSessionCookie(result.user.id);
  redirect(localizedPathname(resolvedLocale, signedInHomePath(result.user)));
}

export async function changePasswordAction(
  locale: string,
  _previous: AuthFormState | null,
  formData: FormData,
): Promise<AuthFormState> {
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({locale: resolvedLocale, namespace: "Auth.errors"});
  const auth = await getTranslations({locale: resolvedLocale, namespace: "Auth"});
  const session = await readActiveSession();

  if (!session) {
    redirect(localizedPathname(resolvedLocale, "/sign-in"));
  }

  const result = await changeSignedInPassword({
    user: session.user,
    currentPassword: String(formData.get("currentPassword") ?? ""),
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
    currentSessionId: session.sessionId,
  });

  if (!result.ok && result.reason === "current") {
    return {fieldErrors: {currentPassword: t("currentPasswordInvalid")}};
  }

  if (!result.ok) {
    return {fieldErrors: passwordFieldErrors(result.issues, t)};
  }

  return {notice: auth("passwordChangedNotice")};
}

export async function updateProfileAction(
  locale: string,
  _previous: AuthFormState | null,
  formData: FormData,
): Promise<AuthFormState> {
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({locale: resolvedLocale, namespace: "Auth.errors"});
  const auth = await getTranslations({locale: resolvedLocale, namespace: "Auth"});
  const session = await readActiveSession();

  if (!session) {
    redirect(localizedPathname(resolvedLocale, "/sign-in"));
  }

  const contact = parseOptionalContact({
    phone: String(formData.get("phone") ?? ""),
    street: String(formData.get("street") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    city: String(formData.get("city") ?? ""),
    country: String(formData.get("country") ?? ""),
  });
  const values = {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: session.user.email,
    phone: String(formData.get("phone") ?? ""),
    street: String(formData.get("street") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    city: String(formData.get("city") ?? ""),
    country: String(formData.get("country") ?? ""),
  };
  const formKey = String(Date.now());

  if (!contact.ok) {
    const fieldErrors: AuthFormState["fieldErrors"] = {};
    if (contact.fieldErrors.phone) {
      fieldErrors.phone = t("phoneInvalid");
    }
    if (contact.fieldErrors.street) {
      fieldErrors.street = t("streetInvalid");
    }
    if (contact.fieldErrors.postalCode) {
      fieldErrors.postalCode = t("postalCodeInvalid");
    }
    if (contact.fieldErrors.city) {
      fieldErrors.city = t("cityInvalid");
    }
    if (contact.fieldErrors.country) {
      fieldErrors.country = t("countryInvalid");
    }
    return {error: auth("passwordNotSaved"), fieldErrors, values, formKey};
  }

  const result = await updateAccountProfile({
    user: session.user,
    firstName: values.firstName,
    lastName: values.lastName,
    locale: String(formData.get("locale") ?? resolvedLocale),
    contact: contact.contact,
  });

  if (!result.ok) {
    const fieldErrors: AuthFormState["fieldErrors"] = {};
    if (result.fieldErrors.firstName) {
      fieldErrors.firstName = t("nameRequired");
    }
    if (result.fieldErrors.lastName) {
      fieldErrors.lastName = t("nameRequired");
    }
    if (result.fieldErrors.locale) {
      fieldErrors.locale = t("localeInvalid");
    }
    return {error: auth("passwordNotSaved"), fieldErrors, values, formKey};
  }

  return {notice: auth("profileUpdatedNotice")};
}

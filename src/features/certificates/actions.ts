"use server";

import {hasLocale} from "next-intl";
import {getTranslations} from "next-intl/server";

import {canAdminister} from "@/features/auth/policy";
import {readSessionUser} from "@/features/auth/session";
import {CertificateError} from "@/features/certificates/errors";
import {readPdfUpload} from "@/features/certificates/pdf";
import {
  attachCertificate,
  replaceCertificateDocument,
  revokeCertificate,
} from "@/features/certificates/service";
import {revalidateLocalized} from "@/i18n/revalidate";
import {routing, type AppLocale} from "@/i18n/routing";

export type CertificateFormState = {
  ok?: boolean;
  error?: string;
};

function resolveLocale(locale: string): AppLocale {
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

async function requireAdminActor() {
  const actor = await readSessionUser();
  if (!actor || !canAdminister(actor)) {
    throw new CertificateError("forbidden");
  }
  return actor;
}

function localizeCertificateError(
  error: unknown,
  t: (key: CertificateError["code"] | "sendFailed") => string,
): CertificateFormState {
  if (error instanceof CertificateError) {
    return {error: t(error.code)};
  }
  console.error(error);
  return {error: t("sendFailed")};
}

export async function attachCertificateAction(
  locale: string,
  userId: string,
  _previous: CertificateFormState | null,
  formData: FormData,
): Promise<CertificateFormState> {
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "Certificates.errors",
  });

  try {
    const actor = await requireAdminActor();
    const pdf = await readPdfUpload(formData.get("document") as File | null);
    await attachCertificate({
      actor,
      userId,
      courseId: String(formData.get("courseId") ?? ""),
      issuedOn: String(formData.get("issuedOn") ?? ""),
      pdf,
    });
    revalidateCertificateSurfaces(userId);
    return {ok: true};
  } catch (error) {
    return localizeCertificateError(error, t);
  }
}

export async function replaceCertificateAction(
  locale: string,
  userId: string,
  certificateId: string,
  _previous: CertificateFormState | null,
  formData: FormData,
): Promise<CertificateFormState> {
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "Certificates.errors",
  });

  try {
    const actor = await requireAdminActor();
    const pdf = await readPdfUpload(formData.get("document") as File | null);
    await replaceCertificateDocument({
      actor,
      certificateId,
      pdf,
    });
    revalidateCertificateSurfaces(userId);
    return {ok: true};
  } catch (error) {
    return localizeCertificateError(error, t);
  }
}

export async function revokeCertificateAction(
  locale: string,
  userId: string,
  certificateId: string,
  _previous: CertificateFormState | null,
  formData: FormData,
): Promise<CertificateFormState> {
  void _previous;
  void formData;
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "Certificates.errors",
  });

  try {
    const actor = await requireAdminActor();
    await revokeCertificate({actor, certificateId});
    revalidateCertificateSurfaces(userId);
    return {ok: true};
  } catch (error) {
    return localizeCertificateError(error, t);
  }
}

function revalidateCertificateSurfaces(userId: string): void {
  revalidateLocalized("/account/courses");
  revalidateLocalized({pathname: "/admin/users/[id]", params: {id: userId}});
}

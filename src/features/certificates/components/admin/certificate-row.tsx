"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert, AuthNotice} from "@/features/auth/components/auth-field";
import {
  replaceCertificateAction,
  revokeCertificateAction,
} from "@/features/certificates/actions";
import type {CertificateCardView} from "@/features/certificates/views";
import {buttonStyles, Button} from "@/shared/ui/button";
import {DownloadIcon} from "@/shared/ui/icons";
import {StatusLabel} from "@/shared/ui/status-label";

export function AdminCertificateRow({
  locale,
  userId,
  certificate,
}: {
  locale: string;
  userId: string;
  certificate: CertificateCardView;
}) {
  const t = useTranslations("Certificates");
  const [replaceState, replaceAction, replacePending] = useActionState(
    replaceCertificateAction.bind(null, locale, userId, certificate.id),
    null,
  );
  const [revokeState, revokeAction, revokePending] = useActionState(
    revokeCertificateAction.bind(null, locale, userId, certificate.id),
    null,
  );
  const editable = certificate.status === "ACTIVE";

  return (
    <li className="rounded-panel border border-ink bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <p className="font-medium leading-tight">{certificate.courseTitle}</p>
          <p className="mt-1 font-sans text-sm tabular-nums text-ink-muted">
            {t("issuedOn")}: {certificate.issuedOnLabel}
          </p>
        </div>
        <StatusLabel tone={certificate.documentState === "available" ? "strong" : "muted"}>
          {statusLabel(certificate.documentState, t)}
        </StatusLabel>
      </div>

      {replaceState?.error ? (
        <div className="mt-4">
          <AuthAlert>{replaceState.error}</AuthAlert>
        </div>
      ) : null}
      {replaceState?.ok ? (
        <div className="mt-4">
          <AuthNotice>{t("replaced")}</AuthNotice>
        </div>
      ) : null}
      {revokeState?.error ? (
        <div className="mt-4">
          <AuthAlert>{revokeState.error}</AuthAlert>
        </div>
      ) : null}
      {revokeState?.ok ? (
        <div className="mt-4">
          <AuthNotice>{t("revoked")}</AuthNotice>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        {certificate.documentState === "available" ? (
          <a
            href={`/api/certificates/${certificate.id}/document`}
            className={buttonStyles({variant: "secondary"})}
          >
            <DownloadIcon />
            {t("download")}
          </a>
        ) : null}
        {editable ? (
          <form action={revokeAction}>
            <Button type="submit" variant="secondary" disabled={revokePending}>
              {revokePending ? t("revoking") : t("revoke")}
            </Button>
          </form>
        ) : null}
      </div>

      {editable ? (
        <form action={replaceAction} className="mt-4 flex flex-wrap items-center gap-3">
          <input
            name="document"
            type="file"
            accept="application/pdf,.pdf"
            required
            aria-label={t("replacePdf")}
            className="block max-w-full text-sm text-ink file:mr-3 file:min-h-11 file:rounded-panel file:border file:border-ink file:bg-white file:px-4 file:font-semibold file:text-ink hover:file:bg-hover"
          />
          <Button type="submit" variant="secondary" disabled={replacePending}>
            {replacePending ? t("replacing") : t("replace")}
          </Button>
        </form>
      ) : null}
    </li>
  );
}

function statusLabel(
  state: CertificateCardView["documentState"],
  t: ReturnType<typeof useTranslations<"Certificates">>,
): string {
  if (state === "revoked") {
    return t("statusRevoked");
  }
  if (state === "unavailable") {
    return t("statusUnavailable");
  }
  return t("statusAvailable");
}

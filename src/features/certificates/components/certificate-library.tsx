import {getTranslations} from "next-intl/server";

import type {CertificateCardView} from "@/features/certificates/views";
import {buttonStyles} from "@/shared/ui/button";
import {DownloadIcon} from "@/shared/ui/icons";
import {StatusLabel} from "@/shared/ui/status-label";

export async function CertificateLibrary({
  certificates,
}: {
  certificates: CertificateCardView[];
}) {
  const t = await getTranslations("Certificates");

  if (certificates.length === 0) {
    return (
      <div className="mt-8 rounded-panel border border-ink bg-white px-5 py-8">
        <p className="max-w-2xl text-sm leading-7 text-ink-muted">{t("empty")}</p>
      </div>
    );
  }

  const labels: Record<CertificateCardView["documentState"], string> = {
    available: t("statusAvailable"),
    unavailable: t("statusUnavailable"),
    revoked: t("statusRevoked"),
  };

  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2">
      {certificates.map((certificate) => (
        <li
          key={certificate.id}
          className="flex h-full flex-col rounded-panel border border-ink bg-white p-5"
        >
          <StatusLabel
            tone={certificate.documentState === "available" ? "strong" : "muted"}
          >
            {labels[certificate.documentState]}
          </StatusLabel>
          <h3 className="mt-3 font-serif text-subheading leading-tight">
            {certificate.courseTitle}
          </h3>
          <p className="mt-2 font-sans text-sm tabular-nums text-ink-muted">
            {t("issuedOn")}: {certificate.issuedOnLabel}
          </p>
          <div className="grow" />
          <div className="mt-6 border-t border-line pt-4">
            {certificate.documentState === "available" ? (
              <a
                href={`/api/certificates/${certificate.id}/document`}
                className={buttonStyles()}
              >
                <DownloadIcon />
                {t("download")}
              </a>
            ) : (
              <p className="text-sm leading-6 text-ink-muted">
                {certificate.documentState === "revoked"
                  ? t("revokedHelp")
                  : t("unavailableHelp")}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

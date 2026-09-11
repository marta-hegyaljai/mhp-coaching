import type {CourseCertificate, CourseCertificateStatus} from "@/db/schema";
import type {AppLocale} from "@/i18n/routing";
import {formatLongDate} from "@/shared/format/calendar-date";

export type CertificateDocumentState = "available" | "unavailable" | "revoked";

export type CertificateCardView = {
  id: string;
  courseId: string;
  courseTitle: string;
  issuedOn: string;
  /** Localized wall-clock day; `issuedOn` stays ISO for sorting and filenames. */
  issuedOnLabel: string;
  status: CourseCertificateStatus;
  documentState: CertificateDocumentState;
};

export function certificateDocumentState(
  certificate: CourseCertificate,
): CertificateDocumentState {
  if (certificate.status === "REVOKED") {
    return "revoked";
  }

  return certificate.documentId ? "available" : "unavailable";
}

export function toCertificateCardView(
  certificate: CourseCertificate,
  locale: AppLocale,
): CertificateCardView {
  return {
    id: certificate.id,
    courseId: certificate.courseId,
    courseTitle: certificate.courseTitle[locale] ?? certificate.courseTitle.fr,
    issuedOn: certificate.issuedOn,
    issuedOnLabel: formatLongDate(certificate.issuedOn, locale),
    status: certificate.status,
    documentState: certificateDocumentState(certificate),
  };
}

export function certificateAuditSnapshot(certificate: CourseCertificate) {
  return {
    certificateId: certificate.id,
    userId: certificate.userId,
    courseId: certificate.courseId,
    issuedOn: certificate.issuedOn,
    status: certificate.status,
    hasDocument: Boolean(certificate.documentId),
  };
}

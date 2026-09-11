export type CertificateErrorCode =
  | "forbidden"
  | "notFound"
  | "invalidCourse"
  | "invalidIssuedOn"
  | "invalidPdf"
  | "tooLarge"
  | "alreadyRevoked"
  | "unavailable";

export class CertificateError extends Error {
  constructor(readonly code: CertificateErrorCode) {
    super(code);
    this.name = "CertificateError";
  }
}

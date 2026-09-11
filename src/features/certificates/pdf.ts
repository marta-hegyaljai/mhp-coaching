import {
  CERTIFICATE_PDF_CONTENT_TYPE,
  MAX_CERTIFICATE_PDF_BYTES,
  PDF_MAGIC,
} from "@/features/certificates/constants";
import {CertificateError} from "@/features/certificates/errors";

export function validateCertificatePdf(input: {
  bytes: Buffer;
  contentType?: string | null;
}): Buffer {
  if (
    input.contentType &&
    input.contentType.split(";")[0]?.trim().toLowerCase() !==
      CERTIFICATE_PDF_CONTENT_TYPE
  ) {
    throw new CertificateError("invalidPdf");
  }

  if (input.bytes.byteLength === 0) {
    throw new CertificateError("invalidPdf");
  }

  if (input.bytes.byteLength > MAX_CERTIFICATE_PDF_BYTES) {
    throw new CertificateError("tooLarge");
  }

  if (
    input.bytes.byteLength < PDF_MAGIC.byteLength ||
    !input.bytes.subarray(0, PDF_MAGIC.byteLength).equals(PDF_MAGIC)
  ) {
    throw new CertificateError("invalidPdf");
  }

  return input.bytes;
}

export async function readPdfUpload(file: File | null): Promise<Buffer> {
  if (!file || file.size === 0) {
    throw new CertificateError("invalidPdf");
  }

  if (file.size > MAX_CERTIFICATE_PDF_BYTES) {
    throw new CertificateError("tooLarge");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  return validateCertificatePdf({bytes, contentType: file.type});
}

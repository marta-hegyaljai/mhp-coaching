export const MAX_CERTIFICATE_PDF_BYTES = 10 * 1024 * 1024;
export const CERTIFICATE_PDF_CONTENT_TYPE = "application/pdf";
export const PDF_MAGIC = Buffer.from("%PDF-", "ascii");

export const ISSUED_ON_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

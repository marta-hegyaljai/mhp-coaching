import {describe, expect, it} from "vitest";

import {MAX_CERTIFICATE_PDF_BYTES} from "@/features/certificates/constants";
import {CertificateError} from "@/features/certificates/errors";
import {validateCertificatePdf} from "@/features/certificates/pdf";
import {parseIssuedOn} from "@/features/certificates/service";

function pdfBytes(extra = 0): Buffer {
  const body = Buffer.alloc(Math.max(0, extra), 0x20);
  return Buffer.concat([Buffer.from("%PDF-1.4\n"), body, Buffer.from("\n%%EOF\n")]);
}

describe("certificate PDF validation", () => {
  it("accepts a PDF at or under 10 MiB", () => {
    expect(validateCertificatePdf({bytes: pdfBytes()}).subarray(0, 5).toString()).toBe(
      "%PDF-",
    );
  });

  it("rejects missing magic bytes, empty files and oversized payloads", () => {
    expect(() => validateCertificatePdf({bytes: Buffer.from("not-a-pdf")})).toThrow(
      CertificateError,
    );
    expect(() => validateCertificatePdf({bytes: Buffer.alloc(0)})).toThrowError(
      /invalidPdf/,
    );
    expect(() =>
      validateCertificatePdf({
        bytes: Buffer.concat([Buffer.from("%PDF-"), Buffer.alloc(MAX_CERTIFICATE_PDF_BYTES)]),
      }),
    ).toThrowError(/tooLarge/);
  });

  it("rejects a non-PDF content type even when the bytes look like a PDF", () => {
    expect(() =>
      validateCertificatePdf({bytes: pdfBytes(), contentType: "application/octet-stream"}),
    ).toThrowError(/invalidPdf/);
  });
});

describe("issued-on dates", () => {
  it("accepts a real calendar date and rejects impossible days", () => {
    expect(parseIssuedOn("2024-02-29")).toBe("2024-02-29");
    expect(() => parseIssuedOn("2025-02-29")).toThrowError(/invalidIssuedOn/);
    expect(() => parseIssuedOn("2025/01/01")).toThrowError(/invalidIssuedOn/);
  });
});

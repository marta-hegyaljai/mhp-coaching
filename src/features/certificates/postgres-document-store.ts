import {eq} from "drizzle-orm";

import {getDb} from "@/db";
import {courseCertificateDocuments} from "@/db/schema";
import {
  CERTIFICATE_PDF_CONTENT_TYPE,
} from "@/features/certificates/constants";
import type {
  CertificateDocumentStore,
  StoredCertificateDocument,
} from "@/features/certificates/document-store";
import {validateCertificatePdf} from "@/features/certificates/pdf";

export function createPostgresCertificateDocumentStore(): CertificateDocumentStore {
  return {
    async put(bytes) {
      const validated = validateCertificatePdf({
        bytes,
        contentType: CERTIFICATE_PDF_CONTENT_TYPE,
      });
      const [row] = await getDb()
        .insert(courseCertificateDocuments)
        .values({
          bytes: validated,
          byteSize: validated.byteLength,
          contentType: CERTIFICATE_PDF_CONTENT_TYPE,
        })
        .returning({
          id: courseCertificateDocuments.id,
          byteSize: courseCertificateDocuments.byteSize,
          contentType: courseCertificateDocuments.contentType,
        });

      return {
        id: row.id,
        byteSize: row.byteSize,
        contentType: CERTIFICATE_PDF_CONTENT_TYPE,
      } satisfies StoredCertificateDocument;
    },

    async get(id) {
      try {
        const [row] = await getDb()
          .select({bytes: courseCertificateDocuments.bytes})
          .from(courseCertificateDocuments)
          .where(eq(courseCertificateDocuments.id, id))
          .limit(1);

        return row?.bytes ?? null;
      } catch {
        return null;
      }
    },

    async exists(id) {
      try {
        const [row] = await getDb()
          .select({id: courseCertificateDocuments.id})
          .from(courseCertificateDocuments)
          .where(eq(courseCertificateDocuments.id, id))
          .limit(1);
        return Boolean(row);
      } catch {
        return false;
      }
    },

    async remove(id) {
      await getDb()
        .delete(courseCertificateDocuments)
        .where(eq(courseCertificateDocuments.id, id));
    },
  };
}

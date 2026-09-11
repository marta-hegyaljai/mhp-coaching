export type StoredCertificateDocument = {
  id: string;
  byteSize: number;
  contentType: "application/pdf";
};

export type CertificateDocumentStore = {
  put(bytes: Buffer): Promise<StoredCertificateDocument>;
  get(id: string): Promise<Buffer | null>;
  exists(id: string): Promise<boolean>;
  remove(id: string): Promise<void>;
};

import {termsDocument} from "./booking-terms";
import {copyrightDocument} from "./copyright";
import {imprintDocument} from "./imprint";
import {privacyDocument} from "./privacy";
import {termsOfUseDocument} from "./site-terms";
import type {LegalDoc, LegalSlug} from "./types";

export const legalDocuments: LegalDoc[] = [
  imprintDocument,
  privacyDocument,
  termsDocument,
  termsOfUseDocument,
  copyrightDocument,
];

export function getLegalDocument(slug: LegalSlug): LegalDoc | undefined {
  return legalDocuments.find((document) => document.slug === slug);
}

export type {LegalDoc, LegalSlug, LegalSection} from "./types";
export {legalSlugs} from "./types";

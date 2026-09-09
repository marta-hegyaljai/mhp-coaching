import type {PathnameHref} from "@/i18n/href";
import type {AppLocale} from "@/i18n/routing";

export const legalSlugs = [
  "imprint",
  "privacy",
  "terms",
  "termsOfUse",
  "copyright",
] as const;

export type LegalSlug = (typeof legalSlugs)[number];

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  items?: string[];
};

export type LegalDoc = {
  slug: LegalSlug;
  pathname: Extract<
    PathnameHref,
    | "/legal/imprint"
    | "/legal/privacy"
    | "/legal/terms"
    | "/legal/terms-of-use"
    | "/legal/copyright"
  >;
  titleKey:
    | "imprintTitle"
    | "privacyTitle"
    | "termsTitle"
    | "termsOfUseTitle"
    | "copyrightTitle";
  descriptionKey:
    | "imprintDescription"
    | "privacyDescription"
    | "termsDescription"
    | "termsOfUseDescription"
    | "copyrightDescription";
  updatedAt: string;
  sections: Record<AppLocale, LegalSection[]>;
};

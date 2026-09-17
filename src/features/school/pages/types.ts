import type {LocalizedText} from "@/features/courses/types";
import type {PathnameHref} from "@/i18n/href";

import type {WhyChooseBlockId} from "../why-choose";

export type SchoolPageId =
  | "curriculum"
  | "pedagogy"
  | "recognitions"
  | "faculty"
  | "supervision"
  | "method"
  | "publications";

/** Longest meta description Google renders before truncating. */
export const META_DESCRIPTION_LIMIT = 160;

/** Proper nouns and titles that read identically in FR, DE and EN. */
export function untranslated(text: string): LocalizedText {
  return {fr: text, de: text, en: text};
}

/** An accrediting body, plus what it actually certifies here. */
export type SchoolRegistry = {
  name: string;
  href: string;
  scope: LocalizedText;
  /**
   * Accreditation number. Rendered only once the school publishes one, so the
   * page never implies a lookup the visitor cannot perform.
   */
  memberId?: string;
};

export type SchoolPerson = {
  name: string;
  role: LocalizedText;
  training: LocalizedText;
  practice: LocalizedText;
};

/** One published work, with enough metadata to be found in a catalogue. */
export type SchoolWork = {
  title: LocalizedText;
  kind: LocalizedText;
  detail: LocalizedText;
  href?: string;
};

export type SchoolPage = {
  id: SchoolPageId;
  blockId: WhyChooseBlockId;
  pathname: PathnameHref;
  /** Short page name. The H1, the breadcrumb and the sibling nav all use it. */
  name: LocalizedText;
  /** Search-facing title; the H1 stays editorial. */
  metaTitle: LocalizedText;
  /** Never the card body: the two would compete for the same query. */
  metaDescription: LocalizedText;
  /** Opening paragraph. Must advance the card copy, never restate it. */
  lead: LocalizedText;
  body: readonly LocalizedText[];
  registries?: readonly SchoolRegistry[];
  faculty?: readonly SchoolPerson[];
  works?: readonly SchoolWork[];
  /** Renders the published catalogue as the curriculum's own evidence. */
  showsCatalogue?: boolean;
  relatedCourseId?: string;
};

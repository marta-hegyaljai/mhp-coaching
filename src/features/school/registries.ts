import type {SchoolRegistry} from "./pages/types";

/**
 * The accrediting bodies behind the school's recognitions. `memberId` stays
 * absent until the school publishes its accreditation numbers; the page then
 * shows them without a code change.
 */
export const officialRegistries: readonly SchoolRegistry[] = [
  {
    name: "ASCA",
    href: "https://www.asca.ch/",
    scope: {
      fr: "Fondation suisse pour les médecines complémentaires. Reconnaît le cycle 1 (bases médicales) et le cycle 2 (méthode hypnose) — la condition du remboursement par les assurances complémentaires.",
      de: "Schweizerische Stiftung für Komplementärmedizin. Anerkennt Zyklus 1 (medizinische Grundlagen) und Zyklus 2 (Hypnosemethode) — die Bedingung für die Rückerstattung durch Zusatzversicherungen.",
      en: "Swiss foundation for complementary medicine. Recognises cycle 1 (medical foundations) and cycle 2 (hypnosis method) — the condition for complementary-insurance reimbursement.",
    },
  },
  {
    name: "eduQua",
    href: "https://www.eduqua.ch/",
    scope: {
      fr: "Label suisse de qualité pour les institutions de formation continue. Il porte sur la qualité de l’organisme, pas sur une méthode particulière.",
      de: "Schweizer Qualitätslabel für Weiterbildungsinstitutionen. Es betrifft die Qualität der Institution, nicht eine einzelne Methode.",
      en: "Swiss quality label for continuing-education institutions. It covers the organisation's quality, not one particular method.",
    },
  },
  {
    name: "NGH",
    href: "https://www.ngh.net/",
    scope: {
      fr: "National Guild of Hypnotists, la plus ancienne association professionnelle d’hypnotistes. Elle encadre la certification internationale des praticien·ne·s.",
      de: "National Guild of Hypnotists, der älteste Berufsverband für Hypnotiseur·innen. Er regelt die internationale Zertifizierung der Praktiker·innen.",
      en: "National Guild of Hypnotists, the oldest professional association of hypnotists. It governs international practitioner certification.",
    },
  },
];

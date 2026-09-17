import type {LocalizedText} from "@/features/courses/types";
import type {PathnameHref} from "@/i18n/href";

export type WhyChooseBlockId =
  | "diff-curriculum"
  | "diff-theorie"
  | "diff-reconnaissances"
  | "diff-equipe"
  | "diff-supervision"
  | "diff-methode"
  | "diff-publications";

export type WhyChooseBlock = {
  id: WhyChooseBlockId;
  pathname: PathnameHref;
  title: LocalizedText;
  body: LocalizedText;
  link: LocalizedText;
};

export const whyChooseBlocks: readonly WhyChooseBlock[] = [
  {
    id: "diff-curriculum",
    pathname: "/curriculum",
    title: {
      fr: "Un curriculum documenté et public",
      de: "Ein dokumentierter und öffentlicher Lehrplan",
      en: "A documented, public curriculum",
    },
    body: {
      fr: "80 heures de formation de base, 220 heures supplémentaires jusqu’au Maître Praticien·ne, référentiel de compétences et bibliographie scientifique consultables avant inscription.",
      de: "80 Stunden Grundausbildung, 220 weitere Stunden bis zum Master-Praktiker·in, Kompetenzrahmen und wissenschaftliche Bibliografie vor der Anmeldung einsehbar.",
      en: "80 hours of foundation training, 220 additional hours through to Master Practitioner, with a competency framework and scientific bibliography you can consult before enrolling.",
    },
    link: {
      fr: "Voir le curriculum",
      de: "Lehrplan ansehen",
      en: "See the curriculum",
    },
  },
  {
    id: "diff-theorie",
    pathname: "/pedagogy",
    title: {
      fr: "Une assise théorique nommée : la psychoneuroimmunologie",
      de: "Ein benannter theoretischer Rahmen: die Psychoneuroimmunologie",
      en: "A named theoretical foundation: psychoneuroimmunology",
    },
    body: {
      fr: "Notre pédagogie s’appuie explicitement sur la psychoneuroimmunologie — l’interaction documentée entre psychisme, système nerveux et système immunitaire —, une ligne de pensée sur l’interaction corps-esprit remontant à Spinoza et structurant une partie de la recherche en médecine intégrative aujourd’hui.",
      de: "Unsere Pädagogik stützt sich ausdrücklich auf die Psychoneuroimmunologie — die dokumentierte Wechselwirkung zwischen Psyche, Nervensystem und Immunsystem —, eine Denklinie zur Körper-Geist-Wechselwirkung, die bis zu Spinoza zurückreicht und heute einen Teil der Forschung in der integrativen Medizin strukturiert.",
      en: "Our teaching is explicitly grounded in psychoneuroimmunology — the documented interaction between the psyche, the nervous system and the immune system — a line of thought on the body–mind interaction that goes back to Spinoza and still structures part of integrative-medicine research today.",
    },
    link: {
      fr: "Notre approche pédagogique",
      de: "Unser pädagogischer Ansatz",
      en: "Our teaching approach",
    },
  },
  {
    id: "diff-reconnaissances",
    pathname: "/recognitions",
    title: {
      fr: "Des reconnaissances officielles vérifiables",
      de: "Überprüfbare offizielle Anerkennungen",
      en: "Verifiable official recognitions",
    },
    body: {
      fr: "ASCA (cycle 1 : bases médicales, cycle 2 : méthode hypnose), eduQua, NGH — liens directs vers les registres officiels. Ces reconnaissances conditionnent le remboursement par les assurances complémentaires et la viabilité d’une pratique professionnelle après la formation.",
      de: "ASCA (Zyklus 1: medizinische Grundlagen, Zyklus 2: Hypnosemethode), eduQua, NGH — direkte Links zu den offiziellen Registern. Diese Anerkennungen bedingen die Rückerstattung durch Zusatzversicherungen und die Tragfähigkeit einer beruflichen Praxis nach der Ausbildung.",
      en: "ASCA (cycle 1: medical foundations, cycle 2: hypnosis method), eduQua, NGH — direct links to the official registers. These recognitions condition complementary-insurance reimbursement and the viability of a professional practice after training.",
    },
    link: {
      fr: "Vérifier nos reconnaissances",
      de: "Anerkennungen prüfen",
      en: "Check our recognitions",
    },
  },
  {
    id: "diff-equipe",
    pathname: "/faculty",
    title: {
      fr: "Un corps enseignant identifié",
      de: "Ein namentlich ausgewiesenes Dozierendenteam",
      en: "An identified teaching staff",
    },
    body: {
      fr: "Chaque formateur·rice est nommé·e avec son titre professionnel, sa formation certifiante et son champ de pratique clinique.",
      de: "Jede Lehrperson ist namentlich genannt, mit Berufstitel, zertifizierender Ausbildung und klinischem Praxisfeld.",
      en: "Each trainer is named, with their professional title, certifying training and field of clinical practice.",
    },
    link: {
      fr: "Voir l’équipe pédagogique",
      de: "Dozierendenteam ansehen",
      en: "See the teaching staff",
    },
  },
  {
    id: "diff-supervision",
    pathname: "/supervision",
    title: {
      fr: "Une supervision structurée",
      de: "Eine strukturierte Supervision",
      en: "Structured supervision",
    },
    body: {
      fr: "Trois mois de supervision individuelle gratuite par téléphone ou visioconférence après la formation de base, une séance individuelle avec votre instructeur·rice, et des « Cafés Supervision » mensuels en groupe pour échanger et se perfectionner.",
      de: "Drei Monate kostenlose individuelle Supervision per Telefon oder Videokonferenz nach der Grundausbildung, eine Einzelsitzung mit Ihrer Lehrperson, und monatliche Gruppen-« Cafés Supervision » zum Austausch und zur Vertiefung.",
      en: "Three months of complimentary individual supervision by telephone or videoconference after the foundation course, one individual session with your instructor, and monthly group “Cafés Supervision” to exchange and keep developing.",
    },
    link: {
      fr: "Détails de la supervision",
      de: "Details zur Supervision",
      en: "Supervision details",
    },
  },
  {
    id: "diff-methode",
    pathname: "/method",
    title: {
      fr: "Une méthode standardisée et transmissible",
      de: "Eine standardisierte und vermittelbare Methode",
      en: "A standardised, transmissible method",
    },
    body: {
      fr: "Les techniques enseignées (inductions rapides, protocoles de gestion et de test des niveaux de transe) sont conçues pour être apprises et transmises de manière fiable, avec un référentiel de compétences commun à tou·te·s les formateur·rice·s.",
      de: "Die unterrichteten Techniken (schnelle Induktionen, Protokolle zur Steuerung und Prüfung der Tranceebenen) sind so angelegt, dass sie zuverlässig gelernt und weitergegeben werden, mit einem gemeinsamen Kompetenzrahmen für alle Lehrpersonen.",
      en: "The techniques taught (rapid inductions, protocols for managing and testing trance levels) are designed to be learned and transmitted reliably, with a competency framework shared by every trainer.",
    },
    link: {
      fr: "Voir la méthode enseignée",
      de: "Die unterrichtete Methode ansehen",
      en: "See the method taught",
    },
  },
  {
    id: "diff-publications",
    pathname: "/publications",
    title: {
      fr: "Des publications propres",
      de: "Eigene Publikationen",
      en: "Our own publications",
    },
    body: {
      fr: "HypnoScience®, recommandations sur l’usage de l’IA en thérapie complémentaire, un chapitre publié dans The Routledge International Handbook of Trauma-Responsive Peacebuilding (Chapitre 20 : « Hypno-neuro-imagination techniques for promoting mental health in a humanitarian-peacebuilding context »), articles sur les principes de l’hypno-thérapie complémentaire.",
      de: "HypnoScience®, Empfehlungen zum Einsatz von KI in der Komplementärtherapie, ein Kapitel in The Routledge International Handbook of Trauma-Responsive Peacebuilding (Kapitel 20: « Hypno-neuro-imagination techniques for promoting mental health in a humanitarian-peacebuilding context »), Beiträge zu den Prinzipien der komplementären Hypnosetherapie.",
      en: "HypnoScience®, recommendations on the use of AI in complementary therapy, a chapter in The Routledge International Handbook of Trauma-Responsive Peacebuilding (Chapter 20: “Hypno-neuro-imagination techniques for promoting mental health in a humanitarian-peacebuilding context”), and articles on the principles of complementary hypno-therapy.",
    },
    link: {
      fr: "Lire nos publications",
      de: "Unsere Publikationen lesen",
      en: "Read our publications",
    },
  },
] as const;

export function getWhyChooseBlock(id: WhyChooseBlockId): WhyChooseBlock {
  const block = whyChooseBlocks.find((entry) => entry.id === id);

  if (!block) {
    throw new Error(`Unknown why-choose block: ${id}`);
  }

  return block;
}

import {untranslated, type SchoolPage, type SchoolWork} from "./types";

/**
 * Each entry carries the publisher and type a reader needs to look the work up
 * independently. `href` stays absent until a stable public URL is confirmed,
 * so the page never ships a guessed link.
 */
const publishedWorks: readonly SchoolWork[] = [
  {
    title: untranslated(
      "The Routledge International Handbook of Trauma-Responsive Peacebuilding",
    ),
    kind: {fr: "Chapitre d’ouvrage", de: "Buchkapitel", en: "Book chapter"},
    detail: {
      fr: "Chapitre 20, « Hypno-neuro-imagination techniques for promoting mental health in a humanitarian-peacebuilding context », co-écrit par Marta Hegyaljai Python. Éditeur : Routledge.",
      de: "Kapitel 20, „Hypno-neuro-imagination techniques for promoting mental health in a humanitarian-peacebuilding context“, mitverfasst von Marta Hegyaljai Python. Verlag: Routledge.",
      en: "Chapter 20, “Hypno-neuro-imagination techniques for promoting mental health in a humanitarian-peacebuilding context”, co-authored by Marta Hegyaljai Python. Publisher: Routledge.",
    },
  },
  {
    title: untranslated("HypnoScience®"),
    kind: {fr: "Travail de l’école", de: "Arbeit der Schule", en: "School's own work"},
    detail: {
      fr: "Le travail de l’école sur les fondements scientifiques de l’hypnose enseignée ici, et sur la manière dont ces fondements se traduisent en protocoles de séance.",
      de: "Die Arbeit der Schule zu den wissenschaftlichen Grundlagen der hier unterrichteten Hypnose und dazu, wie sich diese Grundlagen in Sitzungsprotokolle übersetzen.",
      en: "The school's work on the scientific foundations of the hypnosis taught here, and on how those foundations translate into session protocols.",
    },
  },
  {
    title: {
      fr: "Usage de l’IA en thérapie complémentaire",
      de: "Einsatz von KI in der Komplementärtherapie",
      en: "Use of AI in complementary therapy",
    },
    kind: {
      fr: "Recommandations professionnelles",
      de: "Fachliche Empfehlungen",
      en: "Professional recommendations",
    },
    detail: {
      fr: "Un cadre d’utilisation de l’intelligence artificielle en thérapie complémentaire : ce qu’elle peut assister, et ce qui doit rester un jugement clinique humain.",
      de: "Ein Rahmen für den Einsatz künstlicher Intelligenz in der Komplementärtherapie: was sie unterstützen kann und was ein menschliches klinisches Urteil bleiben muss.",
      en: "A framework for using artificial intelligence in complementary therapy: what it can assist with, and what must remain a human clinical judgement.",
    },
  },
  {
    title: {
      fr: "Principes de l’hypno-thérapie complémentaire",
      de: "Prinzipien der komplementären Hypnosetherapie",
      en: "Principles of complementary hypno-therapy",
    },
    kind: {fr: "Articles", de: "Beiträge", en: "Articles"},
    detail: {
      fr: "Une série d’articles sur les principes structurants de l’hypno-thérapie complémentaire, utilisés comme support de lecture pendant la formation.",
      de: "Eine Reihe von Beiträgen zu den strukturierenden Prinzipien der komplementären Hypnosetherapie, die während der Ausbildung als Lektüre dienen.",
      en: "A series of articles on the structuring principles of complementary hypno-therapy, used as reading material during the training.",
    },
  },
];

export const publicationsPage: SchoolPage = {
  id: "publications",
  blockId: "diff-publications",
  pathname: "/publications",
  name: {fr: "Publications", de: "Publikationen", en: "Publications"},
  metaTitle: {
    fr: "Publications et recherche de l’école d’hypnose",
    de: "Publikationen und Forschung der Hypnoseschule",
    en: "Publications and research of the hypnosis school",
  },
  metaDescription: {
    fr: "Les travaux publiés de l’école : un chapitre chez Routledge, HypnoScience®, et un cadre d’usage de l’IA en thérapie complémentaire.",
    de: "Die veröffentlichten Arbeiten der Schule: ein Kapitel bei Routledge, HypnoScience® und ein Rahmen für KI in der Komplementärtherapie.",
    en: "The school's published work: a Routledge chapter, HypnoScience®, and a framework for AI use in complementary therapy.",
  },
  lead: {
    fr: "Ce que l’école publie est vérifiable indépendamment. Chaque référence ci-dessous indique son type et son éditeur, de quoi la retrouver sans passer par nous.",
    de: "Was die Schule veröffentlicht, ist unabhängig überprüfbar. Jede Referenz unten nennt Art und Verlag — genug, um sie ohne uns zu finden.",
    en: "What the school publishes can be verified independently. Each reference below states its type and publisher, enough to find it without going through us.",
  },
  body: [],
  works: publishedWorks,
};

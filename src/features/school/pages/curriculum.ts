import type {SchoolPage} from "./types";

export const curriculumPage: SchoolPage = {
  id: "curriculum",
  blockId: "diff-curriculum",
  pathname: "/curriculum",
  name: {fr: "Curriculum", de: "Lehrplan", en: "Curriculum"},
  metaTitle: {
    fr: "Curriculum de la formation en hypnose à Fribourg",
    de: "Lehrplan der Hypnoseausbildung in Freiburg",
    en: "Hypnosis training curriculum in Fribourg",
  },
  metaDescription: {
    fr: "Le cursus complet : 80 heures de praticien·ne OMNI®, 220 heures jusqu’au maître praticien·ne. Durées, heures et prix publiés avant l’inscription.",
    de: "Der vollständige Lehrgang: 80 Stunden OMNI®-Praktiker·in, 220 Stunden bis zum Master. Dauer, Stunden und Preise vor der Anmeldung einsehbar.",
    en: "The full path: 80 hours of OMNI® practitioner training, 220 hours through to master practitioner. Durations, hours and prices published up front.",
  },
  lead: {
    fr: "Le cursus se lit en entier avant de s’inscrire. Chaque ligne ci-dessous est une formation publiée, avec sa durée réelle, son nombre d’heures et son prix.",
    de: "Der Lehrgang lässt sich vor der Anmeldung vollständig lesen. Jede Zeile unten ist eine veröffentlichte Ausbildung, mit tatsächlicher Dauer, Stundenzahl und Preis.",
    en: "The whole path can be read before you enrol. Every row below is a published course, with its real duration, its hour count and its price.",
  },
  body: [
    {
      fr: "La formation de base est le Praticien·ne en Hypnose OMNI® : dix jours, 80 heures, à Fribourg. Le parcours de Maître Praticien·ne en Hypnose Elmanienne ajoute quinze jours et 220 heures, en six modules avancés.",
      de: "Die Grundausbildung ist OMNI® Hypnosepraktiker·in: zehn Tage, 80 Stunden, in Freiburg. Der Lehrgang Master-Praktiker·in in elmanischer Hypnose fügt fünfzehn Tage und 220 Stunden in sechs Aufbaumodulen hinzu.",
      en: "The foundation course is the OMNI® Hypnosis Practitioner: ten days, 80 hours, in Fribourg. The Master Practitioner in Elmanian Hypnosis path adds fifteen days and 220 hours across six advanced modules.",
    },
    {
      fr: "Aucune date n’est vendue tant qu’elle n’est pas publiée. Ouvrez une formation pour lire ses objectifs, son public, ses prérequis et ses prochaines sessions.",
      de: "Ein Termin wird erst verkauft, wenn er veröffentlicht ist. Öffnen Sie eine Ausbildung, um Ziele, Zielpublikum, Voraussetzungen und nächste Termine zu lesen.",
      en: "A date is not sold until it is published. Open a course to read its objectives, its audience, its prerequisites and its next sessions.",
    },
  ],
  showsCatalogue: true,
};

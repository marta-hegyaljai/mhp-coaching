import {officialRegistries} from "../registries";

import type {SchoolPage} from "./types";

export const recognitionsPage: SchoolPage = {
  id: "recognitions",
  blockId: "diff-reconnaissances",
  pathname: "/recognitions",
  name: {fr: "Reconnaissances", de: "Anerkennungen", en: "Recognitions"},
  metaTitle: {
    fr: "Reconnaissances ASCA, eduQua et NGH",
    de: "Anerkennungen ASCA, eduQua und NGH",
    en: "ASCA, eduQua and NGH recognitions",
  },
  metaDescription: {
    fr: "Les trois reconnaissances de l’école, ce que chacune couvre exactement, et le lien vers l’organisme qui la délivre.",
    de: "Die drei Anerkennungen der Schule, was jede genau abdeckt, und der Link zur ausstellenden Institution.",
    en: "The school's three recognitions, what each one actually covers, and a link to the body that issues it.",
  },
  lead: {
    fr: "Trois organismes distincts reconnaissent l’école, et chacun couvre autre chose. Voici lequel fait quoi, et où le vérifier vous-même.",
    de: "Drei verschiedene Institutionen anerkennen die Schule, und jede deckt etwas anderes ab. Hier steht, welche was tut und wo Sie es selbst prüfen.",
    en: "Three separate bodies recognise the school, and each covers something different. Here is which does what, and where to check it yourself.",
  },
  body: [
    {
      fr: "La distinction compte au moment de s’installer : ASCA conditionne le remboursement de vos séances par les assurances complémentaires de vos futur·e·s client·e·s, eduQua atteste la qualité de l’organisme de formation, et NGH ouvre une certification reconnue à l’international.",
      de: "Die Unterscheidung zählt bei der Praxiseröffnung: ASCA bedingt die Rückerstattung Ihrer Sitzungen durch die Zusatzversicherungen Ihrer künftigen Klient·innen, eduQua bescheinigt die Qualität der Ausbildungsinstitution, und NGH eröffnet eine international anerkannte Zertifizierung.",
      en: "The distinction matters when you set up practice: ASCA conditions whether your future clients' complementary insurance reimburses your sessions, eduQua attests to the training organisation's quality, and NGH opens an internationally recognised certification.",
    },
  ],
  registries: officialRegistries,
};

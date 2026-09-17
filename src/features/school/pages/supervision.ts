import type {SchoolPage} from "./types";

export const supervisionPage: SchoolPage = {
  id: "supervision",
  blockId: "diff-supervision",
  pathname: "/supervision",
  name: {fr: "Supervision", de: "Supervision", en: "Supervision"},
  metaTitle: {
    fr: "Supervision après la formation en hypnose",
    de: "Supervision nach der Hypnoseausbildung",
    en: "Supervision after the hypnosis training",
  },
  metaDescription: {
    fr: "Trois mois de supervision individuelle incluse après la formation de base, puis les Cafés Supervision mensuels en groupe.",
    de: "Drei Monate individuelle Supervision nach der Grundausbildung inbegriffen, danach die monatlichen Cafés Supervision in der Gruppe.",
    en: "Three months of individual supervision included after the foundation course, then the monthly group Cafés Supervision.",
  },
  lead: {
    fr: "La supervision n’est pas une option vendue après coup : elle commence avec la formation de base, puis reste disponible aussi longtemps que vous pratiquez.",
    de: "Supervision ist keine nachträglich verkaufte Option: Sie beginnt mit der Grundausbildung und bleibt verfügbar, solange Sie praktizieren.",
    en: "Supervision is not an option sold afterwards: it starts with the foundation course, then stays available for as long as you practise.",
  },
  body: [
    {
      fr: "Après la formation de base, trois mois de supervision individuelle restent ouverts par téléphone ou visioconférence, sans frais supplémentaires. Une séance individuelle a lieu avec votre instructeur·rice.",
      de: "Nach der Grundausbildung bleiben drei Monate individuelle Supervision per Telefon oder Videokonferenz ohne Zusatzkosten offen. Eine Einzelsitzung findet mit Ihrer Lehrperson statt.",
      en: "After the foundation course, three months of individual supervision remain open by telephone or videoconference, at no extra charge. One individual session takes place with your instructor.",
    },
    {
      fr: "Les Cafés Supervision sont des soirées de supervision de groupe en visioconférence, distinctes des modules de formation. Chaque date se réserve séparément dans le catalogue.",
      de: "Die Cafés Supervision sind Abende der Gruppensupervision per Videokonferenz, getrennt von den Ausbildungsmodulen. Jeder Termin wird im Katalog einzeln reserviert.",
      en: "Cafés Supervision are group-supervision evenings by videoconference, distinct from the training modules. Each date is booked separately in the catalogue.",
    },
  ],
  relatedCourseId: "cafe-supervision",
};

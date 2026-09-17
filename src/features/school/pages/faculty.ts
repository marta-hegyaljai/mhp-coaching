import type {SchoolPage, SchoolPerson} from "./types";

export const teachingStaff: readonly SchoolPerson[] = [
  {
    name: "Marta Hegyaljai Python",
    role: {
      fr: "Directrice & fondatrice · formatrice en hypnose",
      de: "Direktorin & Gründerin · Hypnoseausbilderin",
      en: "Director & founder · hypnosis trainer",
    },
    training: {
      fr: "Formation universitaire en ethnologie, psychologie et sciences de la communication (Universität Zürich), complétée par la médiation interculturelle, la psychothérapie brève, la PNL, le coaching, l’hypnose ericksonienne, l’hypnose classique et la formation certifiante OMNI®.",
      de: "Universitäre Ausbildung in Ethnologie, Psychologie und Kommunikationswissenschaften (Universität Zürich), ergänzt durch interkulturelle Mediation, Kurzzeitpsychotherapie, NLP, Coaching, ericksonsche und klassische Hypnose sowie die zertifizierende OMNI®-Ausbildung.",
      en: "University training in ethnology, psychology and communication sciences (Universität Zürich), completed by intercultural mediation, brief psychotherapy, NLP, coaching, Ericksonian and classical hypnosis, and certifying OMNI® training.",
    },
    practice: {
      fr: "Accompagnement thérapeutique, hypnose, formation des praticien·ne·s et supervision. Parcours également construit au CICR, en gestion d’équipe et en recherche en sciences sociales.",
      de: "Therapeutische Begleitung, Hypnose, Ausbildung von Praktiker·innen und Supervision. Der Werdegang umfasst auch IKRK-Arbeit, Teamleitung und sozialwissenschaftliche Forschung.",
      en: "Therapeutic accompaniment, hypnosis, practitioner training and supervision. Her path also includes ICRC work, team leadership and social-science research.",
    },
  },
];

export const facultyPage: SchoolPage = {
  id: "faculty",
  blockId: "diff-equipe",
  pathname: "/faculty",
  name: {
    fr: "Équipe pédagogique",
    de: "Dozierende",
    en: "Teaching staff",
  },
  metaTitle: {
    fr: "Équipe pédagogique de l’école d’hypnose",
    de: "Dozierende der Hypnoseschule",
    en: "Teaching staff of the hypnosis school",
  },
  metaDescription: {
    fr: "Qui enseigne : parcours, titre professionnel et champ de pratique clinique de la direction pédagogique de l’école.",
    de: "Wer unterrichtet: Werdegang, Berufstitel und klinisches Praxisfeld der pädagogischen Leitung der Schule.",
    en: "Who teaches: background, professional title and field of clinical practice of the school's teaching leadership.",
  },
  lead: {
    fr: "L’école est dirigée et enseignée par sa fondatrice. Chaque session est encadrée par un·e instructeur·rice et des assistant·e·s, pour seize participant·e·s au maximum.",
    de: "Die Schule wird von ihrer Gründerin geleitet und unterrichtet. Jede Session wird von einer Lehrperson und Assistierenden begleitet, für höchstens sechzehn Teilnehmende.",
    en: "The school is led and taught by its founder. Every session is run by an instructor with assistants, for a maximum of sixteen participants.",
  },
  body: [
    {
      fr: "Ce rapport d’encadrement est la raison pour laquelle les groupes restent petits : une technique d’hypnose s’apprend en étant observé·e et corrigé·e, pas en écoutant une démonstration depuis le fond d’une salle.",
      de: "Dieses Betreuungsverhältnis ist der Grund, warum die Gruppen klein bleiben: Eine Hypnosetechnik lernt man, indem man beobachtet und korrigiert wird, nicht indem man einer Demonstration aus der letzten Reihe zuhört.",
      en: "That supervision ratio is why the groups stay small: a hypnosis technique is learned by being watched and corrected, not by listening to a demonstration from the back of a room.",
    },
  ],
  faculty: teachingStaff,
};

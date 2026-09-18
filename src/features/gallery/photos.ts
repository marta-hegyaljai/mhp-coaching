import type {AppLocale} from "@/i18n/routing";

export type GalleryPhoto = {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: Record<AppLocale, string>;
};

/**
 * A curated edit of the school's documentary photography. Keeping the
 * selection here gives the home album, gallery and metadata one source of
 * truth, while every image keeps useful localized alternative text.
 *
 * Photography: Ben Moreau / BAM Studio.
 */
export const galleryPhotos = [
  {
    id: "classroom",
    src: "/images/gallery/classroom-with-marta.webp",
    width: 1024,
    height: 683,
    alt: {
      fr: "Marta Hegyaljai Python anime une formation devant un petit groupe à Fribourg",
      de: "Marta Hegyaljai Python unterrichtet eine kleine Gruppe in Freiburg",
      en: "Marta Hegyaljai Python teaching a small group in Fribourg",
    },
  },
  {
    id: "marta-teaching-with-notes",
    src: "/images/gallery/marta-teaching-with-notes.webp",
    width: 1024,
    height: 683,
    alt: {
      fr: "Marta Hegyaljai Python explique un point pendant qu’une participante prend des notes",
      de: "Marta Hegyaljai Python erklärt einen Punkt, während eine Teilnehmerin mitschreibt",
      en: "Marta Hegyaljai Python explaining a point while a participant takes notes",
    },
  },
  {
    id: "marta-presenting-with-banner",
    src: "/images/gallery/marta-presenting-with-banner.webp",
    width: 1024,
    height: 683,
    alt: {
      fr: "Marta Hegyaljai Python présente devant le groupe, roll-up de l’école à ses côtés",
      de: "Marta Hegyaljai Python spricht vor der Gruppe, das Schulbanner neben ihr",
      en: "Marta Hegyaljai Python presenting to the group, with the school banner beside her",
    },
  },
  {
    id: "marta-addressing-the-room",
    src: "/images/gallery/marta-addressing-the-room.webp",
    width: 1024,
    height: 683,
    alt: {
      fr: "Marta Hegyaljai Python s’adresse à la salle, les participant·e·s assis aux tables",
      de: "Marta Hegyaljai Python spricht in den Raum, die Teilnehmenden sitzen an den Tischen",
      en: "Marta Hegyaljai Python addressing the room, with participants seated at the tables",
    },
  },
  {
    id: "training-room-overview",
    src: "/images/gallery/training-room-overview.webp",
    width: 1024,
    height: 544,
    alt: {
      fr: "Vue d’ensemble d’une salle de formation, le groupe autour des tables",
      de: "Überblick über einen Schulungsraum, die Gruppe an den Tischen",
      en: "Overview of a training room, with the group seated around the tables",
    },
  },
  {
    id: "marta-teaching-from-behind",
    src: "/images/gallery/marta-teaching-from-behind.webp",
    width: 1024,
    height: 683,
    alt: {
      fr: "Marta Hegyaljai Python, de dos, parle au groupe dans la salle de formation",
      de: "Marta Hegyaljai Python spricht von hinten gesehen zur Gruppe im Schulungsraum",
      en: "Marta Hegyaljai Python, seen from behind, speaking to the group in the training room",
    },
  },
  {
    id: "marta-beside-the-slide",
    src: "/images/gallery/marta-beside-the-slide.webp",
    width: 1024,
    height: 683,
    alt: {
      fr: "Marta Hegyaljai Python sourit à côté de la projection pendant un cours",
      de: "Marta Hegyaljai Python lächelt neben der Projektion während des Unterrichts",
      en: "Marta Hegyaljai Python smiling beside the slide during a class",
    },
  },
  {
    id: "demonstration-advanced-techniques",
    src: "/images/gallery/demonstration-advanced-techniques.webp",
    width: 1024,
    height: 682,
    alt: {
      fr: "Marta Hegyaljai Python démontre une technique avec un participant face au groupe",
      de: "Marta Hegyaljai Python demonstriert eine Technik mit einem Teilnehmer vor der Gruppe",
      en: "Marta Hegyaljai Python demonstrating a technique with a participant in front of the group",
    },
  },
  {
    id: "catalepsy-exercise",
    src: "/images/gallery/catalepsy-exercise.webp",
    width: 1250,
    height: 833,
    alt: {
      fr: "Deux participantes réalisent un exercice d’hypnose, Marta Hegyaljai Python observe",
      de: "Zwei Teilnehmerinnen führen eine Hypnoseübung aus, Marta Hegyaljai Python beobachtet",
      en: "Two participants carrying out a hypnosis exercise while Marta Hegyaljai Python observes",
    },
  },
  {
    id: "practice-by-the-window",
    src: "/images/gallery/practice-by-the-window.webp",
    width: 1250,
    height: 833,
    alt: {
      fr: "Une participante guide une autre personne lors d’un exercice pratique près de la fenêtre",
      de: "Eine Teilnehmerin begleitet eine andere Person bei einer praktischen Übung am Fenster",
      en: "A participant guiding another person through a practical exercise by the window",
    },
  },
  {
    id: "hypnosis-induction",
    src: "/images/gallery/hypnosis-induction.webp",
    width: 1080,
    height: 720,
    alt: {
      fr: "Une participante pratique une induction d’hypnose en recouvrant les yeux de l’autre personne",
      de: "Eine Teilnehmerin führt eine Hypnoseinduktion aus und bedeckt die Augen der anderen Person",
      en: "A participant practising a hypnosis induction by covering the other person’s eyes",
    },
  },
  {
    id: "induction-at-the-forehead",
    src: "/images/gallery/induction-at-the-forehead.webp",
    width: 1024,
    height: 683,
    alt: {
      fr: "Une participante pratique une induction d’hypnose, la main levée près du front",
      de: "Eine Teilnehmerin übt eine Hypnoseinduktion, die Hand nahe der Stirn",
      en: "A participant practising a hypnosis induction, hand raised near the forehead",
    },
  },
  {
    id: "group-exercise-standing",
    src: "/images/gallery/group-exercise-standing.webp",
    width: 1024,
    height: 682,
    alt: {
      fr: "Une participante guide un petit groupe, les yeux fermés, pendant un exercice",
      de: "Eine Teilnehmerin führt eine kleine Gruppe mit geschlossenen Augen durch eine Übung",
      en: "A participant guiding a small group, eyes closed, through an exercise",
    },
  },
  {
    id: "guided-practice",
    src: "/images/gallery/guided-practice.webp",
    width: 1024,
    height: 683,
    alt: {
      fr: "Deux participantes réalisent un exercice pratique d’hypnose",
      de: "Zwei Teilnehmerinnen bei einer praktischen Hypnoseübung",
      en: "Two participants carrying out a practical hypnosis exercise",
    },
  },
  {
    id: "paired-practice-with-notes",
    src: "/images/gallery/paired-practice-with-notes.webp",
    width: 1024,
    height: 683,
    alt: {
      fr: "Deux participant·e·s travaillent en binôme, cahiers ouverts, près des fenêtres",
      de: "Zwei Teilnehmende üben zu zweit mit offenen Heften an den Fenstern",
      en: "Two participants working as a pair, notebooks open, by the windows",
    },
  },
  {
    id: "practice-conversation",
    src: "/images/gallery/practice-conversation.webp",
    width: 1080,
    height: 720,
    alt: {
      fr: "Deux participantes échangent pendant un exercice pratique",
      de: "Zwei Teilnehmerinnen tauschen sich während einer praktischen Übung aus",
      en: "Two participants talking during a practical exercise",
    },
  },
  {
    id: "exercise",
    src: "/images/gallery/hypnosis-exercise.webp",
    width: 1080,
    height: 720,
    alt: {
      fr: "Deux participantes pratiquent une séance d’hypnose supervisée",
      de: "Zwei Teilnehmerinnen bei einer begleiteten Hypnoseübung",
      en: "Two participants practising a supervised hypnosis session",
    },
  },
  {
    id: "supervision",
    src: "/images/gallery/supervised-practice.webp",
    width: 1080,
    height: 720,
    alt: {
      fr: "Une participante guide une autre personne lors d’un exercice pratique",
      de: "Eine Teilnehmerin begleitet eine andere Person bei einer praktischen Übung",
      en: "A participant guiding another person through a practical exercise",
    },
  },
  {
    id: "participant-eyes-closed",
    src: "/images/gallery/participant-eyes-closed.webp",
    width: 1024,
    height: 683,
    alt: {
      fr: "Un participant, les yeux fermés, pendant un exercice d’hypnose",
      de: "Ein Teilnehmer mit geschlossenen Augen während einer Hypnoseübung",
      en: "A participant with eyes closed during a hypnosis exercise",
    },
  },
  {
    id: "learning-together",
    src: "/images/gallery/learning-together.webp",
    width: 1250,
    height: 833,
    alt: {
      fr: "Deux participantes apprennent ensemble pendant un exercice",
      de: "Zwei Teilnehmerinnen lernen gemeinsam während einer Übung",
      en: "Two participants learning together during an exercise",
    },
  },
  {
    id: "laughter",
    src: "/images/gallery/conversation-and-laughter.webp",
    width: 1000,
    height: 667,
    alt: {
      fr: "Deux participantes échangent et rient pendant une formation",
      de: "Zwei Teilnehmerinnen unterhalten sich und lachen während einer Ausbildung",
      en: "Two participants talking and laughing during a course",
    },
  },
  {
    id: "break",
    src: "/images/gallery/break-at-the-center.webp",
    width: 1250,
    height: 833,
    alt: {
      fr: "Des participantes échangent autour d’une table pendant une pause",
      de: "Teilnehmerinnen tauschen sich während einer Pause am Tisch aus",
      en: "Participants talking around a table during a break",
    },
  },
  {
    id: "conversation",
    src: "/images/gallery/conversation-during-break.webp",
    width: 1024,
    height: 683,
    alt: {
      fr: "Deux participantes discutent près du buffet pendant une pause",
      de: "Zwei Teilnehmerinnen unterhalten sich in einer Pause am Buffet",
      en: "Two participants talking by the buffet during a break",
    },
  },
  {
    id: "workshop",
    src: "/images/gallery/workshop-contribution.webp",
    width: 1250,
    height: 833,
    alt: {
      fr: "Une participante contribue à un atelier au tableau",
      de: "Eine Teilnehmerin arbeitet bei einem Workshop am Flipchart",
      en: "A participant contributing at the board during a workshop",
    },
  },
  {
    id: "teaching-board",
    src: "/images/gallery/teaching-at-the-board.webp",
    width: 1250,
    height: 833,
    alt: {
      fr: "Une formatrice explique un concept au tableau devant le groupe",
      de: "Eine Dozentin erklärt der Gruppe ein Konzept am Flipchart",
      en: "An instructor explaining a concept to the group at the board",
    },
  },
  {
    id: "training-room",
    src: "/images/gallery/training-room.webp",
    width: 1024,
    height: 683,
    alt: {
      fr: "Une salle de formation lumineuse du centre mhp-coaching",
      de: "Ein heller Schulungsraum im Zentrum von mhp-coaching",
      en: "A bright training room at the mhp-coaching centre",
    },
  },
  {
    id: "demonstration",
    src: "/images/gallery/small-group-demonstration.webp",
    width: 1024,
    height: 683,
    alt: {
      fr: "Un formateur accompagne une participante lors d’une démonstration en petit groupe",
      de: "Ein Dozent begleitet eine Teilnehmerin bei einer Demonstration in der Kleingruppe",
      en: "An instructor guides a participant during a small-group demonstration",
    },
  },
  {
    id: "participant-listening-at-table",
    src: "/images/gallery/participant-listening-at-table.webp",
    width: 683,
    height: 1024,
    alt: {
      fr: "Une participante écoute, les yeux baissés, à sa table pendant un cours",
      de: "Eine Teilnehmerin hört mit gesenktem Blick an ihrem Tisch im Unterricht zu",
      en: "A participant listening with lowered eyes at her table during class",
    },
  },
  {
    id: "listening-from-the-tables",
    src: "/images/gallery/listening-from-the-tables.webp",
    width: 1024,
    height: 683,
    alt: {
      fr: "Des participantes écoutent depuis leurs tables pendant une formation",
      de: "Teilnehmerinnen hören von ihren Tischen aus einer Ausbildung zu",
      en: "Participants listening from their tables during a course",
    },
  },
  {
    id: "participant-speaking-in-class",
    src: "/images/gallery/participant-speaking-in-class.webp",
    width: 1024,
    height: 683,
    alt: {
      fr: "Un participant prend la parole pendant un cours",
      de: "Ein Teilnehmer spricht während des Unterrichts",
      en: "A participant speaking during class",
    },
  },
  {
    id: "participant-at-the-desk",
    src: "/images/gallery/participant-at-the-desk.webp",
    width: 1024,
    height: 683,
    alt: {
      fr: "Un participant écoute depuis sa table pendant une formation",
      de: "Ein Teilnehmer hört an seinem Tisch einer Ausbildung zu",
      en: "A participant listening from his desk during a course",
    },
  },
  {
    id: "participant-in-the-room",
    src: "/images/gallery/participant-in-the-room.webp",
    width: 1024,
    height: 682,
    alt: {
      fr: "Un participant sourit pendant une formation",
      de: "Ein Teilnehmer lächelt während einer Ausbildung",
      en: "A participant smiling during a course",
    },
  },
  {
    id: "participant",
    src: "/images/gallery/participant-in-class.webp",
    width: 1024,
    height: 683,
    alt: {
      fr: "Un participant sourit pendant un cours",
      de: "Ein Teilnehmer lächelt während des Unterrichts",
      en: "A participant smiling during class",
    },
  },
  {
    id: "participant-taking-notes",
    src: "/images/gallery/participant-taking-notes.webp",
    width: 1080,
    height: 720,
    alt: {
      fr: "Une participante écoute, carnet sur les genoux, pendant un cours",
      de: "Eine Teilnehmerin hört zu, Notizbuch auf dem Schoss, während des Unterrichts",
      en: "A participant listening with a notebook on her lap during class",
    },
  },
  {
    id: "participant-smiling",
    src: "/images/gallery/participant-smiling.webp",
    width: 1080,
    height: 720,
    alt: {
      fr: "Un participant sourit pendant un échange en formation",
      de: "Ein Teilnehmer lächelt während eines Austauschs in der Ausbildung",
      en: "A participant smiling during a conversation in class",
    },
  },
  {
    id: "practice-beside-the-banner",
    src: "/images/gallery/practice-beside-the-banner.webp",
    width: 1024,
    height: 682,
    alt: {
      fr: "Deux participant·e·s travaillent en binôme à côté du roll-up de l’école",
      de: "Zwei Teilnehmende üben zu zweit neben dem Schulbanner",
      en: "Two participants practising as a pair beside the school banner",
    },
  },
] as const satisfies readonly GalleryPhoto[];

export const galleryLeadPhoto = galleryPhotos[0];

const homeGalleryPhotoIds = [
  "marta-teaching-with-notes",
  "marta-presenting-with-banner",
  "marta-addressing-the-room",
  "participant-listening-at-table",
  "marta-teaching-from-behind",
  "training-room-overview",
  "marta-beside-the-slide",
  "practice-by-the-window",
  "hypnosis-induction",
  "catalepsy-exercise",
  "demonstration-advanced-techniques",
  "classroom",
  "laughter",
  "group-exercise-standing",
  "guided-practice",
  "paired-practice-with-notes",
  "learning-together",
  "conversation",
] as const;

function photoById(id: (typeof homeGalleryPhotoIds)[number]) {
  const photo = galleryPhotos.find((entry) => entry.id === id);
  if (!photo) {
    throw new Error(`Missing home gallery photograph: ${id}`);
  }
  return photo;
}

export const homeGalleryPhotos = homeGalleryPhotoIds.map(photoById);

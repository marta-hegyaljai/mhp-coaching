import type {Course} from "./types";

const venueLausanne = {
  fr: "mhp | hypnose, Place Chauderon 3, 1003 Lausanne",
  de: "mhp | hypnose, Place Chauderon 3, 1003 Lausanne",
  en: "mhp | hypnose, Place Chauderon 3, 1003 Lausanne",
};

const venueGeneva = {
  fr: "mhp | hypnose, Rue de la Scie 4, 1207 Genève",
  de: "mhp | hypnose, Rue de la Scie 4, 1207 Genf",
  en: "mhp | hypnose, Rue de la Scie 4, 1207 Geneva",
};

const venueFribourg = {
  fr: "mhp | hypnose, Chemin de la Fenetta 42, 1752 Villars-sur-Glâne",
  de: "mhp | hypnose, Chemin de la Fenetta 42, 1752 Villars-sur-Glâne",
  en: "mhp | hypnose, Chemin de la Fenetta 42, 1752 Villars-sur-Glâne",
};

export const courses: Course[] = [
  {
    id: "omni-practitioner",
    slug: {
      fr: "praticien-hypnose-omni",
      de: "omni-hypnose-praktiker",
      en: "omni-hypnosis-practitioner",
    },
    title: {
      fr: "Praticien·ne en hypnose OMNI",
      de: "OMNI-Hypnosepraktiker·in",
      en: "OMNI Hypnosis Practitioner",
    },
    shortDescription: {
      fr: "La formation de base en hypnose elmanienne : dix jours intensifs, orientés pratique, pour hypnotiser avec clarté et confiance.",
      de: "Die Grundlagenausbildung in elmanischer Hypnose: zehn intensive, praxisnahe Tage, um klar und sicher zu hypnotisieren.",
      en: "The foundational Elmanian hypnosis training: ten intensive, practice-led days to hypnotise with clarity and confidence.",
    },
    description: {
      fr: "Cette formation constitue le socle du cursus mhp | hypnose. Elle transmet la méthode OMNI, une hypnose contemporaine issue du travail de Dave Elman et de Gerald F. Kein : inductions rapides, tests de profondeur, suggestions précises et déroulement complet d’une séance. Le groupe est limité à 16 personnes, encadrées par un·e instructeur·trice et des assistant·e·s, pour un enseignement réellement individualisé. À l’issue du parcours, vous disposez d’outils concrets pour accompagner des client·e·s — que vous deveniez hypnothérapeute, enrichissiez une pratique existante ou cherchiez des techniques solides pour votre propre travail d’accompagnement.",
      de: "Diese Ausbildung bildet das Fundament des mhp | hypnose-Curriculums. Sie vermittelt die OMNI-Methode, eine zeitgenössische Hypnose aus der Arbeit von Dave Elman und Gerald F. Kein: schnelle Induktionen, Tiefentests, präzise Suggestionen und der vollständige Ablauf einer Sitzung. Die Gruppe ist auf 16 Personen begrenzt und wird von einer Lehrperson sowie Assistierenden begleitet. Am Ende verfügen Sie über konkrete Werkzeuge, um Klientinnen und Klienten zu begleiten.",
      en: "This training is the foundation of the mhp | hypnose curriculum. It teaches the OMNI method, a contemporary approach rooted in the work of Dave Elman and Gerald F. Kein: rapid inductions, depth testing, precise suggestion and a complete session structure. Groups are limited to 16 people, with an instructor and assistants, so teaching stays personal. You leave with practical tools to support clients — whether you become a hypnotherapist, enrich an existing practice, or want reliable techniques for your own accompanying work.",
    },
    audience: {
      fr: "Professionnel·le·s de l’accompagnement, personnes en reconversion et toute personne stable psychologiquement, dès 18 ans, souhaitant une formation professionnelle — pas un programme d’auto-thérapie.",
      de: "Fachpersonen der Begleitung, Menschen in beruflicher Neuorientierung und psychisch stabile Erwachsene ab 18 Jahren, die eine professionelle Ausbildung suchen — kein Selbsttherapie-Programm.",
      en: "Helping professionals, people changing career, and psychologically stable adults aged 18 or over who want professional training — not a self-therapy programme.",
    },
    duration: {
      fr: "10 jours · 80 heures",
      de: "10 Tage · 80 Stunden",
      en: "10 days · 80 hours",
    },
    priceChf: 3490,
    category: "foundation",
    dates: [
      {
        id: "omni-practitioner-geneva-2026-09",
        startDate: "2026-09-10",
        endDate: "2026-09-20",
        location: {fr: "Genève", de: "Genf", en: "Geneva"},
        venue: venueGeneva,
        capacity: 16,
        active: true,
      },
      {
        id: "omni-practitioner-lausanne-2026-10",
        startDate: "2026-10-08",
        endDate: "2026-10-18",
        location: {fr: "Lausanne", de: "Lausanne", en: "Lausanne"},
        venue: venueLausanne,
        capacity: 16,
        active: true,
      },
      {
        id: "omni-practitioner-fribourg-2026-11",
        startDate: "2026-11-12",
        endDate: "2026-11-22",
        location: {fr: "Fribourg", de: "Freiburg", en: "Fribourg"},
        venue: venueFribourg,
        capacity: 16,
        active: true,
      },
    ],
  },
  {
    id: "advanced-techniques",
    slug: {
      fr: "hypnose-techniques-avancees",
      de: "hypnose-fortgeschrittene-techniken",
      en: "advanced-hypnosis-techniques",
    },
    title: {
      fr: "Hypnose : techniques avancées",
      de: "Hypnose: fortgeschrittene Techniken",
      en: "Advanced hypnosis techniques",
    },
    shortDescription: {
      fr: "Trois jours pour affiner inductions, profondeur et stratégie thérapeutique après la formation de praticien·ne.",
      de: "Drei Tage, um Induktion, Tiefe und therapeutische Strategie nach der Praktikerausbildung zu verfeinern.",
      en: "Three days to refine induction, depth and therapeutic strategy after practitioner training.",
    },
    description: {
      fr: "Ce module s’adresse aux praticien·ne·s déjà formé·e·s qui souhaitent gagner en précision. Vous travaillez des techniques d’induction plus exigeantes, le contrôle de la profondeur, la gestion des résistances et l’articulation d’un processus thérapeutique clair. La pédagogie reste très pratique : démonstrations, exercices supervisés et retours individualisés.",
      de: "Dieses Modul richtet sich an bereits ausgebildete Praktikerinnen und Praktiker, die präziser arbeiten möchten. Sie vertiefen anspruchsvolle Induktionen, Tiefenkontrolle, den Umgang mit Widerstand und einen klaren therapeutischen Prozess. Der Unterricht bleibt stark praxisorientiert.",
      en: "This module is for trained practitioners who want more precision. You work with more demanding inductions, depth control, resistance, and a clear therapeutic process. Teaching stays highly practical: demonstrations, supervised exercises and individual feedback.",
    },
    audience: {
      fr: "Praticien·ne·s en hypnose OMNI ou formation équivalente. Le diplôme de praticien·ne est recommandé.",
      de: "OMNI-Hypnosepraktiker·innen oder vergleichbare Ausbildung. Das Praktikerdiplom wird empfohlen.",
      en: "OMNI hypnosis practitioners or equivalent training. The practitioner diploma is recommended.",
    },
    duration: {
      fr: "3 jours · 24 heures",
      de: "3 Tage · 24 Stunden",
      en: "3 days · 24 hours",
    },
    priceChf: 890,
    category: "advanced",
    dates: [
      {
        id: "advanced-techniques-lausanne-2026-09",
        startDate: "2026-09-04",
        endDate: "2026-09-06",
        location: {fr: "Lausanne", de: "Lausanne", en: "Lausanne"},
        venue: venueLausanne,
        capacity: 16,
        active: true,
      },
    ],
  },
  {
    id: "anxiety-hypnosis",
    slug: {
      fr: "troubles-anxieux-hypnose",
      de: "angststoerungen-hypnose",
      en: "anxiety-and-hypnosis",
    },
    title: {
      fr: "Troubles anxieux et hypnose",
      de: "Angststörungen und Hypnose",
      en: "Anxiety and hypnosis",
    },
    shortDescription: {
      fr: "Un module de trois jours pour accompagner peurs, phobies et états anxieux avec des protocoles elmaniens clairs.",
      de: "Drei Tage, um Ängste, Phobien und Angstzustände mit klaren elmanischen Protokollen zu begleiten.",
      en: "A three-day module for working with fears, phobias and anxious states using clear Elmanian protocols.",
    },
    description: {
      fr: "L’anxiété est l’un des motifs les plus fréquents en cabinet. Ce module relie entretien orienté solution, hypnose profonde et formats thérapeutiques concrets. Vous apprenez à distinguer les tableaux cliniques courants, à poser un cadre sûr et à choisir une stratégie adaptée — sans transformer la formation en cursus de psychopathologie.",
      de: "Angst gehört zu den häufigsten Anliegen in der Praxis. Das Modul verbindet lösungsorientiertes Gespräch, tiefe Hypnose und konkrete therapeutische Formate. Sie lernen, geläufige Bilder zu unterscheiden, einen sicheren Rahmen zu setzen und eine passende Strategie zu wählen.",
      en: "Anxiety is one of the most common reasons people seek hypnosis. This module connects solution-focused interviewing, deep hypnosis and concrete therapeutic formats. You learn to distinguish common presentations, hold a safe frame and choose a fitting strategy — without turning the course into a psychopathology degree.",
    },
    audience: {
      fr: "Praticien·ne·s en hypnose souhaitant approfondir le travail sur l’anxiété. Formation de base requise.",
      de: "Hypnosepraktiker·innen, die die Arbeit mit Angst vertiefen möchten. Grundlagenausbildung erforderlich.",
      en: "Hypnosis practitioners who want to deepen anxiety work. Foundational training required.",
    },
    duration: {
      fr: "3 jours · 24 heures",
      de: "3 Tage · 24 Stunden",
      en: "3 days · 24 hours",
    },
    priceChf: 890,
    category: "advanced",
    dates: [
      {
        id: "anxiety-hypnosis-lausanne-2026-10",
        startDate: "2026-10-30",
        endDate: "2026-11-01",
        location: {fr: "Lausanne", de: "Lausanne", en: "Lausanne"},
        venue: venueLausanne,
        capacity: 16,
        active: true,
      },
    ],
  },
  {
    id: "children-hypnosis",
    slug: {
      fr: "enfants-et-hypnose",
      de: "kinder-und-hypnose",
      en: "children-and-hypnosis",
    },
    title: {
      fr: "Enfants et hypnose",
      de: "Kinder und Hypnose",
      en: "Children and hypnosis",
    },
    shortDescription: {
      fr: "Deux jours pour adapter langage, cadre et techniques aux enfants et à leur famille.",
      de: "Zwei Tage, um Sprache, Rahmen und Techniken an Kinder und ihre Familien anzupassen.",
      en: "Two days to adapt language, frame and technique to children and their families.",
    },
    description: {
      fr: "Travailler avec les enfants demande un autre rythme, un langage plus concret et une alliance avec les parents. Ce module présente des inductions adaptées, des supports imaginatifs et des précautions éthiques. L’objectif est d’offrir des séances courtes, respectueuses et efficaces, sans copier le travail adulte.",
      de: "Die Arbeit mit Kindern braucht ein anderes Tempo, konkretere Sprache und eine Allianz mit den Eltern. Das Modul zeigt angepasste Induktionen, imaginative Hilfen und ethische Sorgfalt. Ziel sind kurze, respektvolle und wirksame Sitzungen.",
      en: "Working with children needs a different pace, more concrete language and an alliance with parents. This module covers adapted inductions, imaginative supports and ethical care. The aim is short, respectful, effective sessions — not a copy of adult work.",
    },
    audience: {
      fr: "Praticien·ne·s en hypnose. Une expérience préalable avec les enfants est utile, mais n’est pas obligatoire.",
      de: "Hypnosepraktiker·innen. Vorerfahrung mit Kindern ist hilfreich, aber nicht zwingend.",
      en: "Hypnosis practitioners. Prior experience with children is helpful, not required.",
    },
    duration: {
      fr: "2 jours · 16 heures",
      de: "2 Tage · 16 Stunden",
      en: "2 days · 16 hours",
    },
    priceChf: 580,
    category: "advanced",
    dates: [
      {
        id: "children-hypnosis-lausanne-2026-10",
        startDate: "2026-10-03",
        endDate: "2026-10-04",
        location: {fr: "Lausanne", de: "Lausanne", en: "Lausanne"},
        venue: venueLausanne,
        capacity: 16,
        active: true,
      },
    ],
  },
  {
    id: "sport-hypnosis",
    slug: {
      fr: "sport-et-hypnose",
      de: "sport-und-hypnose",
      en: "sport-and-hypnosis",
    },
    title: {
      fr: "Sport et hypnose",
      de: "Sport und Hypnose",
      en: "Sport and hypnosis",
    },
    shortDescription: {
      fr: "Préparation mentale, concentration et récupération : deux jours d’hypnose appliquée au sport.",
      de: "Mentale Vorbereitung, Konzentration und Erholung: zwei Tage Hypnose im Sport.",
      en: "Two days of hypnosis applied to mental preparation, focus and recovery in sport.",
    },
    description: {
      fr: "L’hypnose est un levier concret pour la préparation mentale : routine de performance, gestion du stress compétitif, récupération et image de soi. Ce module s’adresse aux praticien·ne·s qui accompagnent sportif·ve·s amateur·e·s ou professionnel·le·s, ainsi qu’aux coachs déjà formé·e·s à l’hypnose.",
      de: "Hypnose ist ein konkreter Hebel für mentale Vorbereitung: Leistungsroutine, Wettkampfstress, Erholung und Selbstbild. Das Modul richtet sich an Praktikerinnen und Praktiker, die Sportlerinnen und Sportler begleiten, sowie an Coaches mit Hypnoseausbildung.",
      en: "Hypnosis is a practical lever for mental preparation: performance routines, competitive stress, recovery and self-image. This module is for practitioners who work with amateur or professional athletes, and for coaches already trained in hypnosis.",
    },
    audience: {
      fr: "Praticien·ne·s en hypnose et coachs sportifs formés à l’hypnose.",
      de: "Hypnosepraktiker·innen und sportliche Coaches mit Hypnoseausbildung.",
      en: "Hypnosis practitioners and sports coaches trained in hypnosis.",
    },
    duration: {
      fr: "2 jours · 16 heures",
      de: "2 Tage · 16 Stunden",
      en: "2 days · 16 hours",
    },
    priceChf: 580,
    category: "advanced",
    dates: [
      {
        id: "sport-hypnosis-lausanne-2026-10",
        startDate: "2026-10-24",
        endDate: "2026-10-25",
        location: {fr: "Lausanne", de: "Lausanne", en: "Lausanne"},
        venue: venueLausanne,
        capacity: 16,
        active: true,
      },
    ],
  },
  {
    id: "addictions-hypnosis",
    slug: {
      fr: "addictions-et-hypnose",
      de: "sucht-und-hypnose",
      en: "addictions-and-hypnosis",
    },
    title: {
      fr: "Addictions et hypnose",
      de: "Sucht und Hypnose",
      en: "Addictions and hypnosis",
    },
    shortDescription: {
      fr: "Deux jours pour travailler tabac, habitudes et dépendances dans un cadre éthique et orienté solution.",
      de: "Zwei Tage zu Tabak, Gewohnheiten und Abhängigkeiten in einem ethischen, lösungsorientierten Rahmen.",
      en: "Two days on tobacco, habits and addictions within an ethical, solution-focused frame.",
    },
    description: {
      fr: "Les demandes liées au tabac et aux habitudes compulsives sont fréquentes. Ce module clarifie ce que l’hypnose peut faire — et ce qu’elle ne remplace pas. Vous y travaillez des protocoles elmaniens, la motivation au changement et les limites d’un accompagnement en cabinet, avec une attention particulière à la sécurité et à l’orientation vers un suivi médical lorsque c’est nécessaire.",
      de: "Anliegen rund um Tabak und Zwangsgewohnheiten sind häufig. Das Modul klärt, was Hypnose leisten kann — und was sie nicht ersetzt. Sie arbeiten mit elmanischen Protokollen, Veränderungsmotivation und den Grenzen der Praxisarbeit, inklusive Weiterleitung an medizinische Betreuung wenn nötig.",
      en: "Tobacco and compulsive habits are common requests. This module clarifies what hypnosis can do — and what it does not replace. You work with Elmanian protocols, change motivation and the limits of private practice, including referral to medical care when needed.",
    },
    audience: {
      fr: "Praticien·ne·s en hypnose. Formation de base requise. Ce module n’est pas une formation en addictologie médicale.",
      de: "Hypnosepraktiker·innen. Grundlagenausbildung erforderlich. Kein medizinisches Suchttherapie-Diplom.",
      en: "Hypnosis practitioners. Foundational training required. This is not a medical addiction-therapy qualification.",
    },
    duration: {
      fr: "2 jours · 16 heures",
      de: "2 Tage · 16 Stunden",
      en: "2 days · 16 hours",
    },
    priceChf: 580,
    category: "advanced",
    dates: [
      {
        id: "addictions-hypnosis-lausanne-2026-11",
        startDate: "2026-11-28",
        endDate: "2026-11-29",
        location: {fr: "Lausanne", de: "Lausanne", en: "Lausanne"},
        venue: venueLausanne,
        capacity: 16,
        active: true,
      },
    ],
  },
];

import {organization} from "@/features/organization/info";

import type {LegalDoc} from "./types";

export const copyrightDocument = {
  slug: "copyright",
  pathname: "/legal/copyright",
  titleKey: "copyrightTitle",
  descriptionKey: "copyrightDescription",
  updatedAt: "2026-09-09",
  sections: {
    fr: [
      {
        heading: "Licence des contenus mhp-coaching",
        paragraphs: [
          "mhp-coaching croit au partage libre et responsable du savoir. Sauf mention contraire, les contenus créés par l’école — articles, documents, supports de formation, scripts, images, audios — sont publiés sous licence Creative Commons Attribution 4.0 International (CC BY 4.0).",
          "Vous pouvez les partager, adapter et réutiliser, y compris à des fins commerciales, à condition de citer correctement l’auteur, d’indiquer la licence et de signaler les modifications.",
        ],
      },
      {
        heading: "Comment citer",
        paragraphs: [
          "Indiquez clairement le nom de l’auteur s’il est connu, mhp-coaching – MHP Coaching, la licence CC BY 4.0 et un lien vers la source lorsqu’il existe.",
          `Formule : © « [titre de l’œuvre] » ([lien]) de [auteur le cas échéant] mhp-coaching – ${organization.legalName} sous licence CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).`,
          `Exemple : © « Support de formation : Praticien en Hypnose Elmanienne » de ${organization.founder} – mhp-coaching – ${organization.legalName} sous licence CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).`,
        ],
      },
      {
        heading: "Adaptations et enregistrements",
        paragraphs: [
          "Vous pouvez adapter, traduire ou transformer un contenu créé par mhp-coaching, y compris enregistrer un script à votre voix, si vous citez l’auteur original, indiquez la licence avec un lien, et précisez que le contenu a été modifié.",
          `Exemple : Adapté d’un texte original de mhp-coaching – ${organization.legalName}, sous licence CC BY 4.0.`,
        ],
      },
      {
        heading: "Usages autorisés",
        paragraphs: [],
        items: [
          "Partager un document tel quel : oui, avec citation de l’auteur et lien vers la licence.",
          "Adapter un contenu pour ses clients : oui, en signalant l’adaptation et en citant la source.",
          "Lire un script à voix haute : oui, en citant et en indiquant l’adaptation le cas échéant.",
          "Utiliser une image dans une présentation : oui, avec citation.",
          "Usage commercial : oui, avec citation complète.",
          "Utiliser sans attribution : non — violation des droits d’auteur.",
        ],
      },
      {
        heading: "Exception OMNI",
        paragraphs: [
          "Les supports de la formation de Praticien·ne en Hypnose OMNI restent la propriété intellectuelle de OMNI Hypnosis Training Center International (Hypnose.net GmbH). Les traductions françaises appartiennent à l’École. Ce matériel n’est pas sous CC BY 4.0 et ne peut pas être reproduit pour diffusion à des tiers.",
        ],
      },
      {
        heading: "Sanctions",
        paragraphs: [
          "Toute violation de la licence ou des droits réservés peut entraîner des sanctions selon le droit suisse et, le cas échéant, le droit applicable dans l’Union européenne.",
        ],
      },
    ],
    de: [
      {
        heading: "Lizenz der mhp-coaching-Inhalte",
        paragraphs: [
          "mhp-coaching setzt auf eine freie und verantwortliche Weitergabe von Wissen. Soweit nicht anders angegeben, stehen von der Schule erstellte Inhalte — Artikel, Unterlagen, Skripte, Bilder, Audios — unter der Creative-Commons-Lizenz Attribution 4.0 International (CC BY 4.0).",
          "Teilen, Anpassen und Weiterverwenden, auch kommerziell, sind erlaubt, sofern Autor, Lizenz und Änderungen korrekt angegeben werden.",
        ],
      },
      {
        heading: "Zitieren",
        paragraphs: [
          "Nennen Sie den Autor soweit bekannt, mhp-coaching – MHP Coaching, die Lizenz CC BY 4.0 und einen Link zur Quelle.",
          `Formel: © « [Titel] » ([Link]) von [Autor soweit bekannt] mhp-coaching – ${organization.legalName} unter CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).`,
          `Beispiel: © « Ausbildungsunterlage: Praktiker in elmanischer Hypnose » von ${organization.founder} – mhp-coaching – ${organization.legalName} unter CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).`,
        ],
      },
      {
        heading: "Bearbeitungen und Aufnahmen",
        paragraphs: [
          "Inhalte von mhp-coaching dürfen übersetzt, umgearbeitet oder mit der eigenen Stimme aufgenommen werden, wenn die Originalautorin genannt, die Lizenz verlinkt und die Bearbeitung kenntlich gemacht wird.",
          `Beispiel: Bearbeitet nach einem Originaltext von mhp-coaching – ${organization.legalName}, Lizenz CC BY 4.0.`,
        ],
      },
      {
        heading: "Zulässige Nutzungen",
        paragraphs: [],
        items: [
          "Dokument unverändert teilen: ja, mit Quellenangabe und Lizenzlink.",
          "Inhalt für Klientinnen anpassen: ja, mit Hinweis auf die Bearbeitung und Quelle.",
          "Skript vorlesen: ja, mit Zitat und Hinweis auf die Bearbeitung.",
          "Bild in einer Präsentation: ja, mit Quellenangabe.",
          "Kommerzielle Nutzung: ja, mit vollständiger Zitation.",
          "Nutzung ohne Namensnennung: nein — Urheberrechtsverletzung.",
        ],
      },
      {
        heading: "OMNI-Ausnahme",
        paragraphs: [
          "Die Unterlagen des OMNI-Hypnose-Praktikers bleiben geistiges Eigentum von OMNI Hypnosis Training Center International (Hypnose.net GmbH). Die französischen Übersetzungen gehören der Schule. Dieses Material steht nicht unter CC BY 4.0 und darf nicht zur Weitergabe an Dritte vervielfältigt werden.",
        ],
      },
      {
        heading: "Sanktionen",
        paragraphs: [
          "Verstösse gegen die Lizenz oder vorbehaltene Rechte können nach schweizerischem Recht und, soweit anwendbar, nach dem Recht der Europäischen Union geahndet werden.",
        ],
      },
    ],
    en: [
      {
        heading: "Licence for mhp-coaching content",
        paragraphs: [
          "mhp-coaching believes in sharing knowledge freely and responsibly. Unless stated otherwise, content created by the school — articles, documents, teaching materials, scripts, images, audio — is published under Creative Commons Attribution 4.0 International (CC BY 4.0).",
          "You may share, adapt and reuse it, including commercially, if you credit the author, name the licence and mark any changes.",
        ],
      },
      {
        heading: "How to credit",
        paragraphs: [
          "State the author’s name if known, mhp-coaching – MHP Coaching, the CC BY 4.0 licence and a link to the source when available.",
          `Formula: © “[title]” ([link]) by [author if any] mhp-coaching – ${organization.legalName} licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).`,
          `Example: © “Training pack: Elmanian Hypnosis Practitioner” by ${organization.founder} – mhp-coaching – ${organization.legalName} licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).`,
        ],
      },
      {
        heading: "Adaptations and recordings",
        paragraphs: [
          "You may adapt, translate or transform mhp-coaching content, including recording a script in your own voice, if you credit the original author, link the licence and say the content was modified.",
          `Example: Adapted from an original text by mhp-coaching – ${organization.legalName}, licensed under CC BY 4.0.`,
        ],
      },
      {
        heading: "Permitted uses",
        paragraphs: [],
        items: [
          "Share a document as-is: yes, with author credit and licence link.",
          "Adapt content for clients: yes, mark the adaptation and credit the source.",
          "Read a script aloud: yes, credit and note any adaptation.",
          "Use an image in a presentation: yes, with a credit.",
          "Commercial use: yes, with a full citation.",
          "Use without attribution: no — copyright infringement.",
        ],
      },
      {
        heading: "OMNI exception",
        paragraphs: [
          "OMNI Hypnosis Practitioner materials remain the intellectual property of OMNI Hypnosis Training Center International (Hypnose.net GmbH). The School holds the copyright in the French translations. That material is not under CC BY 4.0 and must not be reproduced for distribution to third parties.",
        ],
      },
      {
        heading: "Enforcement",
        paragraphs: [
          "Breach of the licence or of reserved rights may be sanctioned under Swiss law and, where applicable, the law of the European Union.",
        ],
      },
    ],
  },
} as const satisfies LegalDoc;

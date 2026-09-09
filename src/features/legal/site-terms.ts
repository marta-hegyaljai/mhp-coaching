import {organization} from "@/features/organization/info";

import type {LegalDoc} from "./types";

export const termsOfUseDocument = {
  slug: "termsOfUse",
  pathname: "/legal/terms-of-use",
  titleKey: "termsOfUseTitle",
  descriptionKey: "termsOfUseDescription",
  updatedAt: "2026-09-09",
  sections: {
    fr: [
      {
        heading: "Article 1 – Objet",
        paragraphs: [
          "Les présentes conditions générales d’utilisation (CGU) définissent l’accès et l’usage du site mhp-coaching (le « Site »). En accédant au Site, l’utilisateur accepte les CGU sans réserve.",
        ],
      },
      {
        heading: "Article 2 – Mentions légales",
        paragraphs: [
          "L’identité de l’éditeur, le siège, les coordonnées, le numéro IDE et les autres mentions d’identification figurent dans les mentions légales.",
        ],
      },
      {
        heading: "Article 3 – Accès au site",
        paragraphs: [
          "Le Site est accessible gratuitement à tout utilisateur disposant d’un accès à Internet. Les coûts d’accès (matériel, logiciels, connexion) restent à la charge de l’utilisateur.",
          `${organization.legalName} peut modifier, suspendre ou interrompre l’accès à tout ou partie du Site, sans préavis.`,
        ],
      },
      {
        heading: "Article 4 – Services proposés",
        paragraphs: [
          "Le Site présente les formations mhp-coaching, permet de s’inscrire aux sessions datées, de rejoindre une liste d’attente, de payer en ligne et de contacter l’école. L’inscription aux formations est régie par les conditions générales d’inscription.",
        ],
      },
      {
        heading: "Article 5 – Propriété intellectuelle",
        paragraphs: [
          "Sauf mention contraire, les contenus du Site (textes, documents, visuels) relèvent de la licence Creative Commons Attribution 4.0 International (CC BY 4.0) et des règles détaillées sur la page Droits d’auteur. Le matériel OMNI demeure soumis à des droits distincts.",
        ],
      },
      {
        heading: "Article 6 – Données personnelles",
        paragraphs: [
          "Le traitement des données personnelles est décrit dans la déclaration de protection des données. L’utilisation du Site implique d’en prendre connaissance.",
        ],
      },
      {
        heading: "Article 7 – Responsabilité",
        paragraphs: [
          `${organization.legalName} s’efforce d’assurer l’exactitude et la mise à jour des informations du Site, sans garantir leur exhaustivité. L’utilisation du Site se fait sous la responsabilité de l’utilisateur. ${organization.legalName} décline toute responsabilité pour les imprécisions, inexactitudes ou omissions.`,
        ],
      },
      {
        heading: "Article 8 – Liens hypertextes",
        paragraphs: [
          `${organization.legalName} n’exerce aucun contrôle sur les sites tiers éventuellement liés et décline toute responsabilité quant à leur contenu. Un lien n’implique aucune approbation.`,
        ],
      },
      {
        heading: "Article 9 – Acceptation et modification",
        paragraphs: [
          "L’usage du Site vaut acceptation des CGU. En cas de désaccord, l’utilisateur est prié de ne pas utiliser le Site.",
          `${organization.legalName} peut modifier les CGU à tout moment. Les modifications prennent effet dès leur publication. Il est recommandé de les consulter régulièrement.`,
        ],
      },
      {
        heading: "Article 10 – Droit applicable",
        paragraphs: [
          `Les CGU sont régies par le droit suisse. Les parties recherchent d’abord une solution amiable. À défaut, les tribunaux compétents sont ceux du siège de ${organization.legalName} (${organization.court.fr}), sous réserve des fors impératifs de protection des consommateurs.`,
        ],
      },
    ],
    de: [
      {
        heading: "Artikel 1 – Gegenstand",
        paragraphs: [
          "Diese Nutzungsbedingungen (CGU) regeln den Zugang zur Website mhp-coaching (die «Website»). Der Zugriff gilt als vorbehaltlose Zustimmung.",
        ],
      },
      {
        heading: "Artikel 2 – Impressum",
        paragraphs: [
          "Herausgeber, Sitz, Kontaktdaten, UID und weitere Identitätsangaben stehen im Impressum.",
        ],
      },
      {
        heading: "Artikel 3 – Zugang",
        paragraphs: [
          "Die Website ist für jede Person mit Internetzugang unentgeltlich erreichbar. Geräte-, Software- und Verbindungskosten trägt die nutzende Person.",
          `${organization.legalName} kann den Zugang ganz oder teilweise ohne Vorankündigung ändern, aussetzen oder unterbrechen.`,
        ],
      },
      {
        heading: "Artikel 4 – Angebote",
        paragraphs: [
          "Die Website stellt die mhp-coaching-Ausbildungen dar und ermöglicht die Anmeldung zu datierten Sessions, den Eintrag auf eine Warteliste, die Online-Zahlung und den Kontakt mit der Schule. Anmeldungen unterliegen den Anmeldebedingungen.",
        ],
      },
      {
        heading: "Artikel 5 – Geistiges Eigentum",
        paragraphs: [
          "Soweit nicht anders angegeben, stehen Inhalte der Website (Texte, Dokumente, Bilder) unter der Creative-Commons-Lizenz Attribution 4.0 International (CC BY 4.0); Einzelheiten auf der Urheberrechtsseite. OMNI-Material unterliegt gesonderten Rechten.",
        ],
      },
      {
        heading: "Artikel 6 – Personendaten",
        paragraphs: [
          "Die Verarbeitung personenbezogener Daten ist in der Datenschutzerklärung beschrieben. Die Nutzung der Website setzt deren Kenntnisnahme voraus.",
        ],
      },
      {
        heading: "Artikel 7 – Haftung",
        paragraphs: [
          `${organization.legalName} bemüht sich um Richtigkeit und Aktualität der Angaben, ohne Vollständigkeit zu garantieren. Die Nutzung erfolgt auf eigene Verantwortung. ${organization.legalName} haftet nicht für Ungenauigkeiten, Fehler oder Auslassungen.`,
        ],
      },
      {
        heading: "Artikel 8 – Hyperlinks",
        paragraphs: [
          `${organization.legalName} kontrolliert verlinkte Drittseiten nicht und übernimmt keine Verantwortung für deren Inhalt. Ein Link bedeutet keine Billigung.`,
        ],
      },
      {
        heading: "Artikel 9 – Zustimmung und Änderungen",
        paragraphs: [
          "Die Nutzung der Website gilt als Zustimmung zu diesen Bedingungen. Bei Ablehnung ist die Website nicht zu nutzen.",
          `${organization.legalName} kann die Bedingungen jederzeit ändern. Änderungen gelten ab Veröffentlichung. Eine regelmässige Lektüre wird empfohlen.`,
        ],
      },
      {
        heading: "Artikel 10 – Anwendbares Recht",
        paragraphs: [
          `Es gilt schweizerisches Recht. Die Parteien suchen zuerst eine einvernehmliche Lösung. Andernfalls sind die Gerichte am Sitz von ${organization.legalName} (${organization.court.de}) zuständig, vorbehaltlich zwingender Verbrauchergerichtsstände.`,
        ],
      },
    ],
    en: [
      {
        heading: "Article 1 – Purpose",
        paragraphs: [
          "These terms of use govern access to the mhp-coaching website (the “Site”). Accessing the Site constitutes full acceptance of these terms.",
        ],
      },
      {
        heading: "Article 2 – Legal notice",
        paragraphs: [
          "The publisher’s identity, registered office, contact details, UID number and other identification particulars are set out in the legal notice.",
        ],
      },
      {
        heading: "Article 3 – Access",
        paragraphs: [
          "The Site is free to use for anyone with internet access. Hardware, software and connection costs remain the user’s.",
          `${organization.legalName} may change, suspend or interrupt access to all or part of the Site without notice.`,
        ],
      },
      {
        heading: "Article 4 – Services",
        paragraphs: [
          "The Site presents mhp-coaching courses and lets visitors book dated sessions, join a waiting list, pay online and contact the school. Course bookings are governed by the booking terms.",
        ],
      },
      {
        heading: "Article 5 – Intellectual property",
        paragraphs: [
          "Unless stated otherwise, Site content (text, documents, visuals) is licensed under Creative Commons Attribution 4.0 International (CC BY 4.0); details are on the copyright page. OMNI materials remain subject to separate rights.",
        ],
      },
      {
        heading: "Article 6 – Personal data",
        paragraphs: [
          "Personal-data processing is described in the privacy notice. Use of the Site implies that you have read it.",
        ],
      },
      {
        heading: "Article 7 – Liability",
        paragraphs: [
          `${organization.legalName} aims to keep Site information accurate and up to date but does not guarantee completeness. Use of the Site is at the user’s own risk. ${organization.legalName} accepts no liability for inaccuracies, errors or omissions.`,
        ],
      },
      {
        heading: "Article 8 – Hyperlinks",
        paragraphs: [
          `${organization.legalName} does not control linked third-party sites and accepts no liability for their content. A link is not an endorsement.`,
        ],
      },
      {
        heading: "Article 9 – Acceptance and changes",
        paragraphs: [
          "Using the Site means you accept these terms. If you disagree, do not use the Site.",
          `${organization.legalName} may change these terms at any time. Changes take effect when published. Users should review them regularly.`,
        ],
      },
      {
        heading: "Article 10 – Governing law",
        paragraphs: [
          `These terms are governed by Swiss law. The parties first seek an amicable solution. Failing that, the competent courts are those at the seat of ${organization.legalName} (${organization.court.en}), subject to any mandatory consumer venues.`,
        ],
      },
    ],
  },
} as const satisfies LegalDoc;

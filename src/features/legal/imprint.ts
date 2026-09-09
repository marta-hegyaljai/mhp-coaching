import {formatPostalAddress, organization} from "@/features/organization/info";

import type {LegalDoc} from "./types";

const seat = formatPostalAddress(organization.addresses.headquarters);
const country = organization.addresses.headquarters.countryName;

export const imprintDocument = {
  slug: "imprint",
  pathname: "/legal/imprint",
  titleKey: "imprintTitle",
  descriptionKey: "imprintDescription",
  updatedAt: "2026-09-09",
  sections: {
    fr: [
      {
        heading: "Éditeur",
        paragraphs: [
          `Le site mhp-coaching est édité par ${organization.legalName}.`,
          organization.activity.fr,
        ],
      },
      {
        heading: "Identité de l’entreprise",
        paragraphs: [
          `Raison sociale : ${organization.legalName}.`,
          `Siège : ${organization.legalName}, ${seat}, ${country.fr}.`,
        ],
      },
      {
        heading: "Direction et représentation",
        paragraphs: [
          `Responsable : ${organization.founder}, ${organization.founderRole.fr}.`,
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          `Téléphone : ${organization.phone}.`,
          `E-mail : ${organization.email}.`,
        ],
      },
      {
        heading: "Hébergement",
        paragraphs: [
          `Le site est hébergé par ${organization.host.name}, ${organization.host.address}.`,
        ],
      },
      {
        heading: "For juridique",
        paragraphs: [
          `Le for juridique est ${organization.court.fr}, sous réserve des dispositions impératives applicables aux consommatrices et consommateurs.`,
        ],
      },
    ],
    de: [
      {
        heading: "Herausgeber",
        paragraphs: [
          `Die Website mhp-coaching wird herausgegeben von ${organization.legalName}.`,
          organization.activity.de,
        ],
      },
      {
        heading: "Unternehmensangaben",
        paragraphs: [
          `Firmenname: ${organization.legalName}.`,
          `Sitz: ${organization.legalName}, ${seat}, ${country.de}.`,
        ],
      },
      {
        heading: "Leitung und Vertretung",
        paragraphs: [
          `Verantwortlich: ${organization.founder}, ${organization.founderRole.de}.`,
        ],
      },
      {
        heading: "Kontakt",
        paragraphs: [
          `Telefon: ${organization.phone}.`,
          `E-Mail: ${organization.email}.`,
        ],
      },
      {
        heading: "Hosting",
        paragraphs: [
          `Die Website wird gehostet von ${organization.host.name}, ${organization.host.address}.`,
        ],
      },
      {
        heading: "Gerichtsstand",
        paragraphs: [
          `Gerichtsstand ist ${organization.court.de}, vorbehaltlich zwingender Vorschriften zum Schutz von Verbraucherinnen und Verbrauchern.`,
        ],
      },
    ],
    en: [
      {
        heading: "Publisher",
        paragraphs: [
          `The mhp-coaching website is published by ${organization.legalName}.`,
          organization.activity.en,
        ],
      },
      {
        heading: "Company identity",
        paragraphs: [
          `Legal name: ${organization.legalName}.`,
          `Registered office: ${organization.legalName}, ${seat}, ${country.en}.`,
        ],
      },
      {
        heading: "Management and representation",
        paragraphs: [
          `Responsible person: ${organization.founder}, ${organization.founderRole.en}.`,
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          `Phone: ${organization.phone}.`,
          `Email: ${organization.email}.`,
        ],
      },
      {
        heading: "Hosting",
        paragraphs: [
          `The website is hosted by ${organization.host.name}, ${organization.host.address}.`,
        ],
      },
      {
        heading: "Jurisdiction",
        paragraphs: [
          `The place of jurisdiction is ${organization.court.en}, subject to any mandatory consumer-protection rules.`,
        ],
      },
    ],
  },
} as const satisfies LegalDoc;

export type PostalAddress = {
  street: string;
  postalCode: string;
  city: string;
  region: string;
  country: "CH";
  countryName: {
    fr: string;
    de: string;
    en: string;
  };
};

export const organization = {
  brandName: "MHP Coaching",
  legalName: "MHP Coaching",
  email: "contact@mhp-coaching.ch",
  emailHref: "mailto:contact@mhp-coaching.ch",
  phone: "+41 79 451 44 92",
  phoneHref: "tel:+41794514492",
  founder: "Marta Hegyaljai Python",
  founderRole: {
    fr: "fondatrice et directrice",
    de: "Gründerin und Direktorin",
    en: "founder and director",
  },
  court: {
    fr: "Fribourg, Suisse",
    de: "Freiburg, Schweiz",
    en: "Fribourg, Switzerland",
  },
  activity: {
    fr: "Exercice de toutes activités en matière de coaching, de business coaching, d’hypnose, de formation et de services dans le domaine du développement personnel.",
    de: "Ausübung sämtlicher Tätigkeiten im Bereich Coaching, Business-Coaching, Hypnose, Ausbildung und Dienstleistungen der persönlichen Entwicklung.",
    en: "All activities in coaching, business coaching, hypnosis, training and personal-development services.",
  },
  host: {
    name: "Vercel Inc.",
    address: "440 N Barranca Ave #4133, Covina, CA 91723, United States",
  },
  addresses: {
    headquarters: {
      street: "Chemin de la Fenetta 42",
      postalCode: "1752",
      city: "Villars-sur-Glâne",
      region: "Fribourg",
      country: "CH",
      countryName: {
        fr: "Suisse",
        de: "Schweiz",
        en: "Switzerland",
      },
    },
  },
} as const;

export function formatPostalAddress(address: PostalAddress): string {
  return `${address.street}, ${address.postalCode} ${address.city}`;
}

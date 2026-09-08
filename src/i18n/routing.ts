import {defineRouting} from "next-intl/routing";

export const locales = ["fr", "de", "en"] as const;

export const routing = defineRouting({
  locales,
  defaultLocale: "fr",
  localePrefix: "always",
  localeDetection: false,
  pathnames: {
    "/": "/",
    "/courses": {
      fr: "/formations",
      de: "/ausbildungen",
      en: "/courses",
    },
    "/courses/[slug]": {
      fr: "/formations/[slug]",
      de: "/ausbildungen/[slug]",
      en: "/courses/[slug]",
    },
    "/courses/[slug]/book": {
      fr: "/formations/[slug]/inscription",
      de: "/ausbildungen/[slug]/anmeldung",
      en: "/courses/[slug]/book",
    },
    "/booking/success": {
      fr: "/inscription/succes",
      de: "/anmeldung/erfolg",
      en: "/booking/success",
    },
    "/booking/cancelled": {
      fr: "/inscription/annulee",
      de: "/anmeldung/abgebrochen",
      en: "/booking/cancelled",
    },
    "/booking/fake-checkout": {
      fr: "/inscription/paiement-test",
      de: "/anmeldung/testzahlung",
      en: "/booking/fake-checkout",
    },
    "/contact": {
      fr: "/contact",
      de: "/kontakt",
      en: "/contact",
    },
    "/legal/privacy": {
      fr: "/mentions-legales/confidentialite",
      de: "/rechtliches/datenschutz",
      en: "/legal/privacy",
    },
    "/legal/terms": {
      fr: "/mentions-legales/conditions",
      de: "/rechtliches/agb",
      en: "/legal/terms",
    },
    "/legal/imprint": {
      fr: "/mentions-legales",
      de: "/rechtliches/impressum",
      en: "/legal/imprint",
    },
    "/staff/bookings": "/staff/bookings",
  },
});

export type AppLocale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;

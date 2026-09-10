import {defineRouting} from "next-intl/routing";

export const locales = ["fr", "de", "en"] as const;

export const routing = defineRouting({
  locales,
  defaultLocale: "fr",
  localePrefix: "always",
  localeDetection: false,
  localeCookie: false,
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
    "/book": {
      fr: "/inscription",
      de: "/anmeldung",
      en: "/book",
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
    "/legal/terms-of-use": {
      fr: "/mentions-legales/cgu",
      de: "/rechtliches/nutzungsbedingungen",
      en: "/legal/terms-of-use",
    },
    "/legal/copyright": {
      fr: "/mentions-legales/droits-auteur",
      de: "/rechtliches/urheberrecht",
      en: "/legal/copyright",
    },
    "/staff/bookings": "/staff/bookings",
    "/sign-in": {
      fr: "/connexion",
      de: "/anmelden",
      en: "/sign-in",
    },
    "/invite/[token]": {
      fr: "/invitation/[token]",
      de: "/einladung/[token]",
      en: "/invite/[token]",
    },
    "/admin": "/admin",
    "/admin/users": "/admin/users",
    "/admin/users/[id]": "/admin/users/[id]",
    "/rooms": {
      fr: "/salles",
      de: "/raeume",
      en: "/rooms",
    },
    "/access-denied": {
      fr: "/acces-refuse",
      de: "/zugriff-verweigert",
      en: "/access-denied",
    },
  },
});

export type AppLocale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;

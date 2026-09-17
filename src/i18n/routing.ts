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
    "/courses/[slug]/advice": {
      fr: "/formations/[slug]/conseil",
      de: "/ausbildungen/[slug]/beratung",
      en: "/courses/[slug]/advice",
    },
    "/advice": {
      fr: "/conseil",
      de: "/beratung",
      en: "/advice",
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
    "/case-library": {
      fr: "/cas-cliniques",
      de: "/fallbibliothek",
      en: "/case-library",
    },
    "/insights": {
      fr: "/perspectives",
      de: "/einblicke",
      en: "/insights",
    },
    "/about": {
      fr: "/a-propos",
      de: "/ueber-uns",
      en: "/about",
    },
    "/curriculum": {
      fr: "/curriculum",
      de: "/lehrplan",
      en: "/curriculum",
    },
    "/pedagogy": {
      fr: "/approche-pedagogique",
      de: "/paedagogischer-ansatz",
      en: "/pedagogy",
    },
    "/recognitions": {
      fr: "/reconnaissances",
      de: "/anerkennungen",
      en: "/recognitions",
    },
    "/faculty": {
      fr: "/equipe",
      de: "/dozierende",
      en: "/faculty",
    },
    "/supervision": {
      fr: "/supervision",
      de: "/supervision",
      en: "/supervision",
    },
    "/method": {
      fr: "/methode",
      de: "/methode",
      en: "/method",
    },
    "/publications": {
      fr: "/publications",
      de: "/publikationen",
      en: "/publications",
    },
    "/reviews": {
      fr: "/avis",
      de: "/stimmen",
      en: "/reviews",
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
    "/sign-up": {
      fr: "/creer-un-compte",
      de: "/konto-erstellen",
      en: "/sign-up",
    },
    "/forgot-password": {
      fr: "/mot-de-passe-oublie",
      de: "/passwort-vergessen",
      en: "/forgot-password",
    },
    "/reset-password/[token]": {
      fr: "/reinitialiser-mot-de-passe/[token]",
      de: "/passwort-zuruecksetzen/[token]",
      en: "/reset-password/[token]",
    },
    "/verify-email/[token]": {
      fr: "/confirmer-email/[token]",
      de: "/e-mail-bestaetigen/[token]",
      en: "/verify-email/[token]",
    },
    "/account": {
      fr: "/compte",
      de: "/konto",
      en: "/account",
    },
    "/account/courses": {
      fr: "/compte/formations",
      de: "/konto/ausbildungen",
      en: "/account/courses",
    },
    "/invite/[token]": {
      fr: "/invitation/[token]",
      de: "/einladung/[token]",
      en: "/invite/[token]",
    },
    "/admin": "/admin",
    "/admin/overview": "/admin/overview",
    "/admin/users": "/admin/users",
    "/admin/users/[id]": "/admin/users/[id]",
    "/admin/rooms": "/admin/rooms",
    "/admin/rooms/[id]": "/admin/rooms/[id]",
    "/admin/settings": "/admin/settings",
    "/admin/bookings": "/admin/bookings",
    "/admin/bookings/new": "/admin/bookings/new",
    "/admin/bookings/[id]": "/admin/bookings/[id]",
    "/admin/requests": "/admin/requests",
    "/admin/requests/[id]": "/admin/requests/[id]",
    "/admin/billing": "/admin/billing",
    "/admin/billing/[userId]": "/admin/billing/[userId]",
    "/admin/courses": "/admin/courses",
    "/admin/courses/[id]": "/admin/courses/[id]",
    "/admin/calls": "/admin/calls",
    "/admin/calls/[id]": "/admin/calls/[id]",
    "/admin/calls/messages/[id]": "/admin/calls/messages/[id]",
    "/rooms": {
      fr: "/salles",
      de: "/raeume",
      en: "/rooms",
    },
    "/rooms/book": {
      fr: "/salles/reserver",
      de: "/raeume/buchen",
      en: "/rooms/book",
    },
    "/rooms/bookings": {
      fr: "/salles/reservations",
      de: "/raeume/buchungen",
      en: "/rooms/bookings",
    },
    "/rooms/bookings/[id]": {
      fr: "/salles/reservations/[id]",
      de: "/raeume/buchungen/[id]",
      en: "/rooms/bookings/[id]",
    },
    "/rooms/bookings/[id]/change": {
      fr: "/salles/reservations/[id]/modifier",
      de: "/raeume/buchungen/[id]/aendern",
      en: "/rooms/bookings/[id]/change",
    },
    "/rooms/bookings/[id]/cancel": {
      fr: "/salles/reservations/[id]/annuler",
      de: "/raeume/buchungen/[id]/stornieren",
      en: "/rooms/bookings/[id]/cancel",
    },
    "/rooms/requests": {
      fr: "/salles/demandes",
      de: "/raeume/anfragen",
      en: "/rooms/requests",
    },
    "/rooms/requests/new": {
      fr: "/salles/demandes/nouvelle",
      de: "/raeume/anfragen/neu",
      en: "/rooms/requests/new",
    },
    "/rooms/requests/[id]": {
      fr: "/salles/demandes/[id]",
      de: "/raeume/anfragen/[id]",
      en: "/rooms/requests/[id]",
    },
    "/billing": {
      fr: "/facturation",
      de: "/abrechnung",
      en: "/billing",
    },
    "/billing/statements/[id]": {
      fr: "/facturation/releves/[id]",
      de: "/abrechnung/auszuege/[id]",
      en: "/billing/statements/[id]",
    },
    "/billing/[year]/[month]": {
      fr: "/facturation/[year]/[month]",
      de: "/abrechnung/[year]/[month]",
      en: "/billing/[year]/[month]",
    },
    "/billing/setup": {
      fr: "/facturation/moyen-de-paiement-test",
      de: "/abrechnung/test-zahlungsmittel",
      en: "/billing/setup",
    },
    "/billing/payment-method/return": {
      fr: "/facturation/moyen-de-paiement/retour",
      de: "/abrechnung/zahlungsmittel/rueckkehr",
      en: "/billing/payment-method/return",
    },
    "/admin/billing/[userId]/statements/[id]": "/admin/billing/[userId]/statements/[id]",
    "/admin/notifications": "/admin/notifications",
    "/access-denied": {
      fr: "/acces-refuse",
      de: "/zugriff-verweigert",
      en: "/access-denied",
    },
  },
});

export type AppLocale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;

import type {MetadataRoute} from "next";

import {getSiteUrl} from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteUrl().origin;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/*/staff",
          "/*/staff/",
          "/*/admin",
          "/*/admin/",
          "/*/compte/",
          "/*/konto/",
          "/*/account/",
          "/*/connexion",
          "/*/anmelden",
          "/*/sign-in",
          "/*/creer-un-compte",
          "/*/konto-erstellen",
          "/*/sign-up",
          "/*/mot-de-passe-oublie",
          "/*/passwort-vergessen",
          "/*/forgot-password",
          "/*/reinitialiser-mot-de-passe/",
          "/*/passwort-zuruecksetzen/",
          "/*/reset-password/",
          "/*/confirmer-email/",
          "/*/e-mail-bestaetigen/",
          "/*/verify-email/",
          "/*/compte",
          "/*/konto",
          "/*/account",
          "/*/invitation/",
          "/*/einladung/",
          "/*/invite/",
          "/*/salles",
          "/*/salles/",
          "/*/raeume",
          "/*/raeume/",
          "/*/rooms",
          "/*/rooms/",
          "/*/acces-refuse",
          "/*/zugriff-verweigert",
          "/*/access-denied",
          "/*/booking/fake-checkout",
          "/*/inscription/paiement-test",
          "/*/anmeldung/testzahlung",
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}

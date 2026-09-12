import type {MetadataRoute} from "next";
import {headers} from "next/headers";

import {classifyRequestHost, getSplitOrigins, requestHost} from "@/lib/origins";
import {getSiteUrl} from "@/lib/site-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = getSiteUrl().origin;
  const split = getSplitOrigins();
  let host = "";
  try {
    host = requestHost(await headers());
  } catch {
    host = "";
  }
  if (split && classifyRequestHost(host, split) === "app") {
    return {
      rules: [{userAgent: "*", disallow: "/"}],
      host: split.app.host,
    };
  }

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
          "/*/facturation",
          "/*/abrechnung",
          "/*/billing",
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

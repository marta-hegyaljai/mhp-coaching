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
          "/*/connexion",
          "/*/anmelden",
          "/*/sign-in",
          "/*/invitation/",
          "/*/einladung/",
          "/*/invite/",
          "/*/salles",
          "/*/raeume",
          "/*/rooms",
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

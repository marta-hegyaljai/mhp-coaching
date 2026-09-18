import {describe, expect, it} from "vitest";

import {localizedPathname} from "./path";

describe("localizedPathname", () => {
  it("prefixes every locale and localizes static routes", () => {
    expect(localizedPathname("fr", "/")).toBe("/fr");
    expect(localizedPathname("fr", "/courses")).toBe("/fr/formations");
    expect(localizedPathname("de", "/courses")).toBe("/de/ausbildungen");
    expect(localizedPathname("en", "/courses")).toBe("/en/courses");
    expect(localizedPathname("de", "/contact")).toBe("/de/kontakt");
    expect(localizedPathname("fr", "/case-library")).toBe("/fr/cas-cliniques");
    expect(localizedPathname("de", "/case-library")).toBe("/de/fallbibliothek");
    expect(localizedPathname("en", "/case-library")).toBe("/en/case-library");
    expect(localizedPathname("fr", "/insights")).toBe("/fr/perspectives");
    expect(localizedPathname("de", "/insights")).toBe("/de/einblicke");
    expect(localizedPathname("en", "/insights")).toBe("/en/insights");
    expect(localizedPathname("fr", "/about")).toBe("/fr/a-propos");
    expect(localizedPathname("de", "/about")).toBe("/de/ueber-uns");
    expect(localizedPathname("en", "/about")).toBe("/en/about");
    expect(localizedPathname("fr", "/curriculum")).toBe("/fr/curriculum");
    expect(localizedPathname("de", "/curriculum")).toBe("/de/lehrplan");
    expect(localizedPathname("fr", "/pedagogy")).toBe("/fr/approche-pedagogique");
    expect(localizedPathname("fr", "/recognitions")).toBe("/fr/reconnaissances");
    expect(localizedPathname("fr", "/faculty")).toBe("/fr/equipe");
    expect(localizedPathname("de", "/faculty")).toBe("/de/dozierende");
    expect(localizedPathname("fr", "/supervision")).toBe("/fr/supervision");
    expect(localizedPathname("fr", "/method")).toBe("/fr/methode");
    expect(localizedPathname("de", "/publications")).toBe("/de/publikationen");
    expect(localizedPathname("fr", "/reviews")).toBe("/fr/avis");
    expect(localizedPathname("de", "/reviews")).toBe("/de/stimmen");
    expect(localizedPathname("en", "/reviews")).toBe("/en/reviews");
    expect(localizedPathname("fr", "/gallery")).toBe("/fr/galerie");
    expect(localizedPathname("de", "/gallery")).toBe("/de/galerie");
    expect(localizedPathname("en", "/gallery")).toBe("/en/gallery");
    expect(localizedPathname("fr", "/sign-in")).toBe("/fr/connexion");
    expect(localizedPathname("de", "/sign-in")).toBe("/de/anmelden");
    expect(localizedPathname("fr", "/sign-up")).toBe("/fr/creer-un-compte");
    expect(localizedPathname("de", "/forgot-password")).toBe("/de/passwort-vergessen");
    expect(localizedPathname("fr", "/account")).toBe("/fr/compte");
    expect(localizedPathname("en", "/account/courses")).toBe("/en/account/courses");
    expect(localizedPathname("en", "/rooms")).toBe("/en/rooms");
    expect(localizedPathname("fr", "/rooms")).toBe("/fr/salles");
    expect(localizedPathname("fr", "/rooms/book")).toBe("/fr/salles/reserver");
    expect(localizedPathname("de", "/rooms/bookings")).toBe("/de/raeume/buchungen");
    expect(
      localizedPathname("en", {
        pathname: "/rooms/bookings/[id]/change",
        params: {id: "11111111-1111-4111-8111-111111111111"},
      }),
    ).toBe("/en/rooms/bookings/11111111-1111-4111-8111-111111111111/change");
    expect(localizedPathname("fr", "/admin/bookings")).toBe("/fr/admin/bookings");
    expect(localizedPathname("fr", "/admin/courses/enrolments")).toBe(
      "/fr/admin/courses/enrolments",
    );
    expect(localizedPathname("fr", "/account/courses")).toBe("/fr/compte/formations");
    expect(localizedPathname("de", "/account/courses")).toBe("/de/konto/ausbildungen");
    expect(localizedPathname("fr", "/book")).toBe("/fr/inscription");
    expect(localizedPathname("en", "/book")).toBe("/en/book");
    expect(localizedPathname("fr", "/legal/imprint")).toBe("/fr/mentions-legales");
    expect(localizedPathname("fr", "/legal/terms-of-use")).toBe(
      "/fr/mentions-legales/cgu",
    );
    expect(localizedPathname("de", "/legal/copyright")).toBe(
      "/de/rechtliches/urheberrecht",
    );
    expect(
      localizedPathname("en", {
        pathname: "/admin/users",
        query: {q: "ada", status: "disabled", page: "2"},
      }),
    ).toBe("/en/admin/users?q=ada&status=disabled&page=2");
    expect(
      localizedPathname("fr", {
        pathname: "/admin/users/[id]",
        params: {id: "user-1"},
        query: {history: "2"},
        hash: "account-history",
      }),
    ).toBe("/fr/admin/users/user-1?history=2#account-history");
  });

  it("fills localized dynamic course slugs", () => {
    expect(
      localizedPathname("fr", {
        pathname: "/courses/[slug]",
        params: {slug: "praticien-hypnose-omni"},
      }),
    ).toBe("/fr/formations/praticien-hypnose-omni");
  });
});

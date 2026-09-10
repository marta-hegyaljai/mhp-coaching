import {describe, expect, it} from "vitest";

import {localizedPathname} from "./path";

describe("localizedPathname", () => {
  it("prefixes every locale and localizes static routes", () => {
    expect(localizedPathname("fr", "/")).toBe("/fr");
    expect(localizedPathname("fr", "/courses")).toBe("/fr/formations");
    expect(localizedPathname("de", "/courses")).toBe("/de/ausbildungen");
    expect(localizedPathname("en", "/courses")).toBe("/en/courses");
    expect(localizedPathname("de", "/contact")).toBe("/de/kontakt");
    expect(localizedPathname("fr", "/sign-in")).toBe("/fr/connexion");
    expect(localizedPathname("de", "/sign-in")).toBe("/de/anmelden");
    expect(localizedPathname("en", "/rooms")).toBe("/en/rooms");
    expect(localizedPathname("fr", "/rooms")).toBe("/fr/salles");
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

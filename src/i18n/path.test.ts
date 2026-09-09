import {describe, expect, it} from "vitest";

import {localizedPathname} from "./path";

describe("localizedPathname", () => {
  it("prefixes every locale and localizes static routes", () => {
    expect(localizedPathname("fr", "/")).toBe("/fr");
    expect(localizedPathname("fr", "/courses")).toBe("/fr/formations");
    expect(localizedPathname("de", "/courses")).toBe("/de/ausbildungen");
    expect(localizedPathname("en", "/courses")).toBe("/en/courses");
    expect(localizedPathname("de", "/contact")).toBe("/de/kontakt");
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
      localizedPathname("fr", {
        pathname: "/courses",
        query: {view: "calendar"},
      }),
    ).toBe("/fr/formations?view=calendar");
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

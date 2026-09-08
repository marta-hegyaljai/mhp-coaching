import {describe, expect, it} from "vitest";

import {absoluteUrl, languageAlternates, localizedPath} from "./metadata";

describe("localized SEO paths", () => {
  it("prefixes every locale and localizes the course catalogue path", () => {
    expect(localizedPath("fr", "/")).toBe("/fr");
    expect(localizedPath("fr", "/courses")).toBe("/fr/formations");
    expect(localizedPath("de", "/courses")).toBe("/de/ausbildungen");
    expect(localizedPath("en", "/courses")).toBe("/en/courses");
  });

  it("builds absolute hreflang maps including x-default French", () => {
    const languages = languageAlternates(() => "/contact");

    expect(languages.fr).toBe(absoluteUrl("/fr/contact"));
    expect(languages.de).toBe(absoluteUrl("/de/kontakt"));
    expect(languages.en).toBe(absoluteUrl("/en/contact"));
    expect(languages["x-default"]).toBe(absoluteUrl("/fr/contact"));
  });

  it("localizes dynamic course slugs", () => {
    expect(
      localizedPath("fr", {
        pathname: "/courses/[slug]",
        params: {slug: "praticien-hypnose-omni"},
      }),
    ).toBe("/fr/formations/praticien-hypnose-omni");
    expect(
      localizedPath("en", {
        pathname: "/courses/[slug]",
        params: {slug: "omni-hypnosis-practitioner"},
      }),
    ).toBe("/en/courses/omni-hypnosis-practitioner");
  });
});

import {describe, expect, it} from "vitest";

import {buildSitemapEntries} from "./sitemap-entries";
import {legacyRedirects} from "./legacy-redirects";

describe("SEO launch surfaces", () => {
  it("includes localized homepages, catalogues and course detail URLs", () => {
    const entries = buildSitemapEntries();
    const urls = entries
      .flatMap((entry) => [
        entry.url,
        ...Object.values(entry.alternates?.languages ?? {}),
      ])
      .filter((url): url is string => Boolean(url));

    expect(urls.some((url) => url.endsWith("/fr"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/de"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/en"))).toBe(true);
    expect(entries.some((entry) => entry.url.endsWith("/de/ausbildungen"))).toBe(
      true,
    );
    expect(entries.some((entry) => entry.url.endsWith("/en/courses"))).toBe(
      true,
    );
    expect(entries.some((entry) => entry.url.endsWith("/fr/cas-cliniques"))).toBe(
      true,
    );
    expect(entries.some((entry) => entry.url.endsWith("/de/einblicke"))).toBe(
      true,
    );
    expect(entries.some((entry) => entry.url.endsWith("/fr/a-propos"))).toBe(
      true,
    );
    expect(urls.some((url) => url.includes("/de/ausbildungen"))).toBe(true);
    expect(urls.some((url) => url.includes("/en/courses/omni-hypnosis-practitioner"))).toBe(true);
    expect(urls.every((url) => !url.includes("/staff"))).toBe(true);
    expect(urls.every((url) => !url.includes("/admin"))).toBe(true);
    expect(urls.every((url) => !url.includes("/sign-in"))).toBe(true);
    expect(urls.every((url) => !url.includes("/sign-up"))).toBe(true);
    expect(urls.every((url) => !url.includes("/account"))).toBe(true);
    expect(urls.every((url) => !url.includes("/forgot-password"))).toBe(true);
    expect(urls.every((url) => !url.includes("/rooms"))).toBe(true);
    expect(urls.every((url) => !url.includes("/compte"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/fr/mentions-legales"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/fr/mentions-legales/cgu"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/de/rechtliches/agb"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/en/legal/copyright"))).toBe(true);
  });

  it("maps valuable legacy French URLs to the new locale-prefixed routes", () => {
    expect(legacyRedirects).toContainEqual({
      source: "/formations/praticien-en-hypnose-elmanienne-omni",
      destination: "/fr/formations/praticien-hypnose-omni",
      permanent: true,
      locale: false,
    });
    expect(legacyRedirects[0]).toMatchObject({source: "/", destination: "/fr"});
  });
});

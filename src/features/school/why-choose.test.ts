import {describe, expect, it} from "vitest";

import {locales} from "@/i18n/routing";

import {META_DESCRIPTION_LIMIT, schoolPagesInOrder, siblingSchoolPages} from "./pages";
import {featuredTestimonials, testimonials} from "./testimonials";
import {whyChooseBlocks} from "./why-choose";

describe("why-choose blocks", () => {
  it("keeps seven equal blocks with stable deep-link ids", () => {
    expect(whyChooseBlocks.map((block) => block.id)).toEqual([
      "diff-curriculum",
      "diff-theorie",
      "diff-reconnaissances",
      "diff-equipe",
      "diff-supervision",
      "diff-methode",
      "diff-publications",
    ]);
  });

  it("points each block at a public school page, in the same order", () => {
    const pathnames = whyChooseBlocks.map((block) => block.pathname);

    expect(pathnames).toEqual([
      "/curriculum",
      "/pedagogy",
      "/recognitions",
      "/faculty",
      "/supervision",
      "/method",
      "/publications",
    ]);
    expect(schoolPagesInOrder.map((page) => page.pathname)).toEqual(pathnames);
  });
});

describe("school pages", () => {
  it("never opens with the card copy the visitor just clicked", () => {
    for (const page of schoolPagesInOrder) {
      const block = whyChooseBlocks.find((entry) => entry.id === page.blockId);

      for (const locale of locales) {
        expect(page.lead[locale]).not.toBe(block?.body[locale]);
      }
    }
  });

  it("keeps meta descriptions inside the length search engines render", () => {
    for (const page of schoolPagesInOrder) {
      for (const locale of locales) {
        expect(
          page.metaDescription[locale].length,
          `${page.id}/${locale}`,
        ).toBeLessThanOrEqual(META_DESCRIPTION_LIMIT);
      }
    }
  });

  it("never repeats a paragraph inside one page", () => {
    for (const page of schoolPagesInOrder) {
      for (const locale of locales) {
        const paragraphs = [page.lead[locale], ...page.body.map((p) => p[locale])];

        expect(new Set(paragraphs).size, `${page.id}/${locale}`).toBe(paragraphs.length);
      }
    }
  });

  it("leaves no page as a dead end", () => {
    for (const page of schoolPagesInOrder) {
      const siblings = siblingSchoolPages(page.id);

      expect(siblings).toHaveLength(schoolPagesInOrder.length - 1);
      expect(siblings.map((sibling) => sibling.id)).not.toContain(page.id);
    }
  });

  it("gives every registry link a scope, so it is never a bare logo drop", () => {
    const registries = schoolPagesInOrder.flatMap((page) => page.registries ?? []);

    expect(registries.length).toBeGreaterThan(0);
    for (const registry of registries) {
      expect(registry.href).toMatch(/^https:\/\//);
      for (const locale of locales) {
        expect(registry.scope[locale].length).toBeGreaterThan(40);
      }
    }
  });
});

describe("reviews", () => {
  it("keeps featured quotes as a homepage subset of the avis list", () => {
    expect(featuredTestimonials).toHaveLength(4);
    expect(testimonials.length).toBeGreaterThan(featuredTestimonials.length);

    for (const featured of featuredTestimonials) {
      expect(testimonials).toContainEqual(featured);
      expect(featured.author).toBeTruthy();
    }
  });

  it("carries the whole historical avis page, with unique ids", () => {
    expect(testimonials.length).toBeGreaterThanOrEqual(113);
    expect(new Set(testimonials.map((entry) => entry.id)).size).toBe(testimonials.length);
    expect(new Set(testimonials.map((entry) => entry.quote)).size).toBe(
      testimonials.length,
    );
  });
});

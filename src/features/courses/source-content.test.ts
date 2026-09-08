import {existsSync} from "node:fs";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {courses} from "./catalog";
import {getCourseImage, getCourseSourceContent} from "./source-content";

describe("historical course content", () => {
  it("covers every published course with real sections and a local image", () => {
    expect(courses).toHaveLength(20);

    for (const course of courses) {
      const source = getCourseSourceContent(course);
      const image = getCourseImage(course);

      expect(source.sourceUrl).toMatch(/^https:\/\/www\.mhp-hypnose\.com\/formations\//);
      expect(source.sections.length).toBeGreaterThan(0);
      expect(source.sections.every((section) => section.items.length > 0)).toBe(true);
      expect(existsSync(join(process.cwd(), "public", image))).toBe(true);
    }
  });

  it("does not reintroduce unsupported legacy locations", () => {
    const detailText = courses
      .map((course) => JSON.stringify(getCourseSourceContent(course)))
      .join(" ");

    expect(detailText).not.toMatch(/Lausanne|Genève|Geneva/i);
  });
});

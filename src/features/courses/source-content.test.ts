import {existsSync} from "node:fs";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {courses} from "./catalog";
import {getCourseImage, getCourseSourceContent} from "./source-content";

describe("historical course content", () => {
  it("covers every published course with real sections and a local image", () => {
    expect(courses).toHaveLength(22);

    for (const course of courses) {
      const source = getCourseSourceContent(course);
      const image = getCourseImage(course);

      expect(source.sections.length).toBeGreaterThan(0);
      expect(source.sections.every((section) => section.items.length > 0)).toBe(true);
      expect(JSON.stringify(source)).not.toMatch(/mhp-hypnose/i);
      expect(existsSync(join(process.cwd(), "public", image))).toBe(true);
    }
  });

  it("does not reintroduce unsupported legacy locations", () => {
    const detailText = courses
      .map((course) => JSON.stringify(getCourseSourceContent(course)))
      .join(" ");

    expect(detailText).not.toMatch(/Lausanne|Genève|Geneva/i);
  });

  it("states NGH and APSH as possibilities on the foundation course", () => {
    const practitioner = courses.find((course) => course.id === "omni-practitioner");
    expect(practitioner).toBeDefined();

    const sections = getCourseSourceContent(practitioner!).sections;
    const ngh = sections.find((section) => section.title === "Diplôme NGH");
    const association = sections.find(
      (section) => section.title === "Association professionnelle",
    );

    expect(ngh?.items).toEqual([
      "Vous avez la possibilité de recevoir le diplôme de la National Guild of Hypnotists (NGH).",
    ]);
    expect(association?.items).toEqual([
      "Possibilité de faire partie de l’Association Professionnelle Suisse pour l’Hypnose Thérapeutique (APSH).",
    ]);
    expect(JSON.stringify(ngh)).not.toMatch(/automatiquement/i);
  });
});

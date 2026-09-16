import {existsSync} from "node:fs";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {courses} from "./catalog";
import {getCourseImage, getCourseSourceContent} from "./source-content";

describe("historical course content", () => {
  it("covers every published course with real sections and a local image", () => {
    expect(courses).toHaveLength(23);

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

  it("keeps the Magie, rire & Hypnose French copy and trainer", () => {
    const course = courses.find((item) => item.id === "magic-laughter-hypnosis");
    expect(course).toBeDefined();

    const source = getCourseSourceContent(course!);
    const objectives = source.sections.find(
      (section) => section.title === "Objectifs pédagogiques",
    );
    const trainer = source.sections.find((section) => section.title === "Formateur");

    expect(objectives?.items).toEqual([
      "Expliquer pourquoi la magie et l’humour facilitent le lien thérapeutique et l’entrée en hypnose chez l’enfant.",
      "Réaliser plusieurs tours de magie simples adaptés au contexte thérapeutique.",
      "Utiliser la surprise, le jeu et l’humour de manière intentionnelle pour établir rapidement le contact avec l’enfant et ses parents.",
      "Intégrer ces outils dans une séquence de séance cohérente et immédiatement reproductible en pratique professionnelle.",
    ]);
    expect(trainer?.items[0]).toBe("Jean Pierre Spack");
  });
});

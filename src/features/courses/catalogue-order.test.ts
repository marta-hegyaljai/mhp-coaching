import {describe, expect, it} from "vitest";

import {
  DEFAULT_CATALOGUE_ORDER,
  defaultDisplayOrderForCourse,
  sortCoursesByCatalogueOrder,
} from "./catalogue-order";

describe("defaultDisplayOrderForCourse", () => {
  it("places foundation first, then the two priority advanced modules", () => {
    expect(defaultDisplayOrderForCourse("omni-practitioner")).toBeLessThan(
      defaultDisplayOrderForCourse("anxiety-hypnosis"),
    );
    expect(defaultDisplayOrderForCourse("anxiety-hypnosis")).toBeLessThan(
      defaultDisplayOrderForCourse("advanced-techniques"),
    );
    expect(defaultDisplayOrderForCourse("advanced-techniques")).toBeLessThan(
      defaultDisplayOrderForCourse("sport-hypnosis"),
    );
  });

  it("trails the bundled programme behind every individual module", () => {
    const programme = defaultDisplayOrderForCourse("master-practitioner");

    expect(programme).toBe(DEFAULT_CATALOGUE_ORDER.length - 1);
    expect(programme).toBeGreaterThan(defaultDisplayOrderForCourse("sensory-anchors-hypnosis"));
  });

  it("lists every seeded catalogue course", () => {
    expect(DEFAULT_CATALOGUE_ORDER).toContain("omni-practitioner");
    expect(DEFAULT_CATALOGUE_ORDER).toContain("anxiety-hypnosis");
    expect(DEFAULT_CATALOGUE_ORDER).toContain("stripe-payment-test");
    expect(DEFAULT_CATALOGUE_ORDER).toContain("cafe-supervision");
  });
});

describe("sortCoursesByCatalogueOrder", () => {
  it("prefers persisted displayOrder over the default map", () => {
    const sorted = sortCoursesByCatalogueOrder([
      {id: "sport-hypnosis", displayOrder: 0},
      {id: "omni-practitioner", displayOrder: 1},
    ]);

    expect(sorted.map((course) => course.id)).toEqual(["sport-hypnosis", "omni-practitioner"]);
  });
});

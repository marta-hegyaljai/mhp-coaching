import {describe, expect, it} from "vitest";

import {agendaByCourseId} from "./sessions";
import {
  getAdvancedCourses,
  getCatalogueCourses,
  getCourseById,
  getCourseBySlug,
  getCourseStaticParams,
  getFoundationCourses,
  getMedicalCourses,
  getPublishedCourses,
  getWorkshopCourses,
} from "./queries";

describe("course catalogue", () => {
  it("exposes unique ids and localized slugs", () => {
    const published = getPublishedCourses();
    const ids = published.map((course) => course.id);

    expect(new Set(ids).size).toBe(ids.length);

    for (const course of published) {
      expect(course.slug.fr).not.toBe(course.slug.de);
      expect(course.slug.fr).not.toBe(course.slug.en);
      expect(getCourseBySlug(course.slug.fr)?.id).toBe(course.id);
      expect(getCourseBySlug(course.slug.de)?.id).toBe(course.id);
      expect(getCourseBySlug(course.slug.en)?.id).toBe(course.id);
    }
  });

  it("keeps paused workshops and the M.I.A. course in the catalogue but off public lists", () => {
    expect(getCatalogueCourses()).toHaveLength(20);
    expect(getPublishedCourses()).toHaveLength(14);
    expect(getFoundationCourses()).toHaveLength(1);
    expect(getAdvancedCourses()).toHaveLength(9);
    expect(getMedicalCourses()).toHaveLength(4);
    expect(getWorkshopCourses()).toHaveLength(0);
    expect(getCourseById("transgenerational-mia")?.published).toBe(false);
    expect(getCourseBySlug("hypnose-transgenerationnelle-methode-mia")).toBeUndefined();
  });

  it("static params only pair each locale with its own published slug", () => {
    const params = getCourseStaticParams();
    const practitioner = getCourseById("omni-practitioner");

    expect(practitioner).toBeDefined();
    expect(params).toContainEqual({
      locale: "fr",
      slug: practitioner!.slug.fr,
    });
    expect(params).not.toContainEqual({
      locale: "fr",
      slug: practitioner!.slug.en,
    });
    expect(params).toHaveLength(getPublishedCourses().length * 3);
  });

  it("keeps the published prices, Fribourg location, and agenda dates", () => {
    const course = getCourseById("omni-practitioner");
    const medicalExam = getCourseById("medical-hypnosis-exam-m3");

    expect(course).toBeDefined();
    expect(course?.priceChf).toBe(3490);
    expect(medicalExam?.priceChf).toBe(550);
    expect(getPublishedCourses().every((item) => item.location.fr === "Fribourg")).toBe(true);
    expect(course?.dates.map((date) => date.startDate)).toEqual([
      "2026-09-10",
      "2026-10-08",
      "2026-11-12",
    ]);
    expect(agendaByCourseId["omni-practitioner"]?.[0]?.endDate).toBe("2026-09-20");
    expect(
      getPublishedCourses().every((item) =>
        item.dates.every((date) => date.location.fr === "Fribourg"),
      ),
    ).toBe(true);
  });
});

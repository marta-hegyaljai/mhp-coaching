import {describe, expect, it} from "vitest";

import {
  getAdvancedCourses,
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

  it("matches the published 20-course catalogue and its four groups", () => {
    expect(getPublishedCourses()).toHaveLength(20);
    expect(getFoundationCourses()).toHaveLength(1);
    expect(getAdvancedCourses()).toHaveLength(10);
    expect(getMedicalCourses()).toHaveLength(4);
    expect(getWorkshopCourses()).toHaveLength(5);
  });

  it("static params only pair each locale with its own slug", () => {
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

  it("keeps the published prices, Fribourg location, and dates pending", () => {
    const course = getCourseById("omni-practitioner");
    const medicalExam = getCourseById("medical-hypnosis-exam-m3");

    expect(course).toBeDefined();
    expect(course?.priceChf).toBe(3490);
    expect(medicalExam?.priceChf).toBe(550);
    expect(getPublishedCourses().every((item) => item.location.fr === "Fribourg")).toBe(true);
    expect(getPublishedCourses().every((item) => item.dates.length === 0)).toBe(true);
  });
});

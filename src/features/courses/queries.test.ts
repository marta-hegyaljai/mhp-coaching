import {describe, expect, it} from "vitest";

import {isCourseDateBookable} from "./dates";
import {getCourseById, getCourseBySlug, getCourseStaticParams, getPublishedCourses} from "./queries";

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

  it("finds the OMNI practitioner course and keeps future dates bookable", () => {
    const course = getCourseById("omni-practitioner");

    expect(course).toBeDefined();
    expect(course?.priceChf).toBe(3490);
    expect(
      course?.dates.every((date) =>
        isCourseDateBookable(date, new Date("2026-01-15T12:00:00Z")),
      ),
    ).toBe(true);
    expect(
      isCourseDateBookable(course!.dates[0], new Date("2027-01-01T12:00:00Z")),
    ).toBe(false);
  });
});

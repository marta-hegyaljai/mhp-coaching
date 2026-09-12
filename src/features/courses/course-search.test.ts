import {describe, expect, it} from "vitest";

import {courses} from "@/features/courses/catalog";

import {
  courseMatchRank,
  courseMatchesQuery,
  filterCoursesForSearch,
} from "./course-search";

const locale = "en" as const;
const omni = courses.find((course) => course.id === "omni-practitioner");
const medical = courses.find((course) => course.id === "medical-hypnosis-m1");

describe("courseMatchesQuery", () => {
  it("matches title and summary text", () => {
    expect(courseMatchesQuery(omni!, locale, "omni")).toBe(true);
    expect(courseMatchesQuery(omni!, locale, "practitioner")).toBe(true);
    expect(courseMatchesQuery(omni!, locale, "zzz")).toBe(false);
  });

  it("treats an empty query as matching every course", () => {
    expect(courseMatchesQuery(omni!, locale, "   ")).toBe(true);
  });
});

describe("courseMatchRank", () => {
  it("prefers title prefixes over partial title matches", () => {
    expect(courseMatchRank(omni!, locale, "omni")).toBeLessThan(
      courseMatchRank(omni!, locale, "practitioner"),
    );
  });
});

describe("filterCoursesForSearch", () => {
  it("sorts prefix matches ahead of summary-only matches", () => {
    const results = filterCoursesForSearch(courses, locale, "hypnosis", "");
    const omniIndex = results.findIndex((course) => course.id === "omni-practitioner");
    const medicalIndex = results.findIndex((course) => course.id === "medical-hypnosis-m1");

    expect(omniIndex).toBeGreaterThanOrEqual(0);
    expect(medicalIndex).toBeGreaterThanOrEqual(0);
    expect(omniIndex).toBeLessThan(medicalIndex);
  });

  it("respects the month filter", () => {
    const month = "2099-01";
    const withoutMonth = filterCoursesForSearch([omni!, medical!], locale, "", "").length;
    const withMonth = filterCoursesForSearch([omni!, medical!], locale, "", month).length;

    expect(withoutMonth).toBe(2);
    expect(withMonth).toBeLessThanOrEqual(withoutMonth);
  });
});

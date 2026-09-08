import {describe, expect, it} from "vitest";

import type {Course} from "@/features/courses/types";

import {
  DATE_TO_BE_CONFIRMED,
  resolveBookingDate,
  unscheduledCourseDateId,
} from "./booking-date";

const baseCourse: Course = {
  id: "course-1",
  slug: {fr: "cours", de: "kurs", en: "course"},
  title: {fr: "Cours", de: "Kurs", en: "Course"},
  shortDescription: {fr: "", de: "", en: ""},
  description: {fr: "", de: "", en: ""},
  audience: {fr: "", de: "", en: ""},
  duration: {fr: "", de: "", en: ""},
  location: {fr: "Fribourg", de: "Freiburg", en: "Fribourg"},
  priceChf: 300,
  category: "workshop",
  dates: [],
};

describe("resolveBookingDate", () => {
  it("creates an explicit schedule-pending snapshot for an undated course", () => {
    const resolved = resolveBookingDate(
      baseCourse,
      unscheduledCourseDateId(baseCourse.id),
    );

    expect(resolved).toMatchObject({
      id: "course-1-date-to-be-confirmed",
      startDate: DATE_TO_BE_CONFIRMED,
      location: baseCourse.location,
    });
  });

  it("rejects a fabricated date id", () => {
    expect(resolveBookingDate(baseCourse, "not-a-real-date")).toBeUndefined();
  });
});

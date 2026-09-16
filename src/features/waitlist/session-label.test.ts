import {describe, expect, it} from "vitest";

import {waitlistSessionLabel} from "./session-label";
import {getCourseById} from "@/features/courses/queries";

describe("waitlistSessionLabel", () => {
  it("uses the pending label when no session is stored", () => {
    const course = getCourseById("omni-practitioner");
    expect(course).toBeTruthy();
    expect(
      waitlistSessionLabel(
        {courseId: "omni-practitioner", courseSessionId: null},
        course ? [course] : [],
        "fr",
        "Dates pending",
      ),
    ).toBe("Dates pending");
  });

  it("formats a known session date", () => {
    const course = getCourseById("omni-practitioner");
    expect(course).toBeTruthy();
    if (!course) {
      return;
    }

    const label = waitlistSessionLabel(
      {courseId: course.id, courseSessionId: "omni-practitioner-2026-10-08"},
      [course],
      "en",
      "Dates pending",
    );
    expect(label).toContain("October");
  });
});

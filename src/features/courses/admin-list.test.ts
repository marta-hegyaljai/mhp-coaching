import {describe, expect, it} from "vitest";

import {
  buildCourseListEntries,
  filterCourseListEntries,
  isCourseListFiltered,
  summarizeCourseList,
} from "@/features/courses/admin-list";
import type {CourseListQuery} from "@/features/courses/admin-query";
import type {Course, CourseCategory, CourseDate} from "@/features/courses/types";

const NOW = new Date("2026-06-01T00:00:00.000Z");

const text = (value: string) => ({fr: value, de: value, en: value});

function date(startDate: string, overrides: Partial<CourseDate> = {}): CourseDate {
  return {
    id: `d-${startDate}`,
    startDate,
    location: text("Genève"),
    capacity: 10,
    active: true,
    ...overrides,
  };
}

function course(id: string, overrides: Partial<Course> = {}): Course {
  return {
    id,
    slug: text(id),
    title: {fr: `FR ${id}`, de: `DE ${id}`, en: `EN ${id}`},
    shortDescription: text(id),
    description: text(id),
    audience: text(id),
    duration: text(id),
    location: text(id),
    category: "advanced" as CourseCategory,
    priceChf: 500,
    dates: [],
    published: true,
    ...overrides,
  };
}

const EMPTY_QUERY: CourseListQuery = {
  q: "",
  category: "all",
  published: "all",
  upcoming: "all",
};

describe("buildCourseListEntries", () => {
  it("numbers rows from the catalogue order and counts enrolments", () => {
    const entries = buildCourseListEntries(
      [course("a"), course("b")],
      new Map([["b", 7]]),
      NOW,
    );

    expect(entries.map((entry) => [entry.course.id, entry.position, entry.enrolments])).toEqual([
      ["a", 1, 0],
      ["b", 2, 7],
    ]);
  });

  it("picks the earliest upcoming session regardless of stored order", () => {
    const entries = buildCourseListEntries(
      [course("a", {dates: [date("2026-09-10"), date("2026-07-02")]})],
      new Map(),
      NOW,
    );

    expect(entries[0]?.nextDate?.startDate).toBe("2026-07-02");
  });

  it("ignores past and inactive sessions when resolving the next date", () => {
    const entries = buildCourseListEntries(
      [
        course("past", {dates: [date("2026-01-05")]}),
        course("inactive", {dates: [date("2026-09-10", {active: false})]}),
        course("none"),
      ],
      new Map(),
      NOW,
    );

    expect(entries.every((entry) => entry.nextDate === undefined)).toBe(true);
    // Sessions still count even when none of them is bookable.
    expect(entries[0]?.sessionCount).toBe(1);
  });

  it("survives enrolment counts for courses that are no longer in the catalogue", () => {
    const entries = buildCourseListEntries([course("a")], new Map([["ghost", 4]]), NOW);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.enrolments).toBe(0);
  });
});

describe("summarizeCourseList", () => {
  it("splits published, unpublished and undated courses", () => {
    const entries = buildCourseListEntries(
      [
        course("a", {dates: [date("2026-09-10")]}),
        course("b", {published: false}),
        course("c"),
      ],
      new Map([
        ["a", 3],
        ["c", 2],
      ]),
      NOW,
    );

    expect(summarizeCourseList(entries)).toEqual({
      total: 3,
      published: 2,
      unpublished: 1,
      withoutUpcoming: 2,
      enrolments: 5,
    });
  });

  it("returns zeroes for an empty catalogue", () => {
    expect(summarizeCourseList([])).toEqual({
      total: 0,
      published: 0,
      unpublished: 0,
      withoutUpcoming: 0,
      enrolments: 0,
    });
  });
});

describe("filterCourseListEntries", () => {
  const entries = buildCourseListEntries(
    [
      course("omni", {category: "foundation", dates: [date("2026-09-10")]}),
      course("anxiety", {category: "advanced"}),
      course("dental", {category: "medical", published: false, dates: [date("2026-10-01")]}),
    ],
    new Map(),
    NOW,
  );

  it("returns everything for the empty query", () => {
    expect(filterCourseListEntries(entries, EMPTY_QUERY)).toHaveLength(3);
  });

  it("narrows by category, visibility and upcoming dates", () => {
    expect(
      filterCourseListEntries(entries, {...EMPTY_QUERY, category: "medical"}).map(
        (entry) => entry.course.id,
      ),
    ).toEqual(["dental"]);
    expect(
      filterCourseListEntries(entries, {...EMPTY_QUERY, published: "no"}).map(
        (entry) => entry.course.id,
      ),
    ).toEqual(["dental"]);
    expect(
      filterCourseListEntries(entries, {...EMPTY_QUERY, upcoming: "no"}).map(
        (entry) => entry.course.id,
      ),
    ).toEqual(["anxiety"]);
  });

  it("matches the search needle on id, slug and every locale title", () => {
    for (const needle of ["omni", "DE omni", "  OMNI  "]) {
      expect(
        filterCourseListEntries(entries, {...EMPTY_QUERY, q: needle}).map(
          (entry) => entry.course.id,
        ),
      ).toEqual(["omni"]);
    }
  });

  it("combines filters and keeps the catalogue position stable", () => {
    const visible = filterCourseListEntries(entries, {
      ...EMPTY_QUERY,
      q: "n",
      published: "yes",
      upcoming: "no",
    });

    expect(visible.map((entry) => [entry.course.id, entry.position])).toEqual([
      ["anxiety", 2],
    ]);
  });
});

describe("isCourseListFiltered", () => {
  it("treats the default query and whitespace-only search as unfiltered", () => {
    expect(isCourseListFiltered(EMPTY_QUERY)).toBe(false);
    expect(isCourseListFiltered({...EMPTY_QUERY, q: "   "})).toBe(false);
  });

  it("detects every narrowing control", () => {
    expect(isCourseListFiltered({...EMPTY_QUERY, q: "omni"})).toBe(true);
    expect(isCourseListFiltered({...EMPTY_QUERY, category: "medical"})).toBe(true);
    expect(isCourseListFiltered({...EMPTY_QUERY, published: "no"})).toBe(true);
    expect(isCourseListFiltered({...EMPTY_QUERY, upcoming: "no"})).toBe(true);
  });
});

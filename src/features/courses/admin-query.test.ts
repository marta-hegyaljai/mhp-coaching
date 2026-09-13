import {describe, expect, it} from "vitest";

import {courseDetailHref, parseCourseRecordQuery} from "./admin-query";

describe("parseCourseRecordQuery", () => {
  it("opens the schedule when the URL has no view", () => {
    expect(parseCourseRecordQuery({})).toMatchObject({
      tab: "sessions",
      show: "all",
      q: "",
      session: "",
      status: "all",
    });
  });

  it("honours an explicit record view", () => {
    expect(parseCourseRecordQuery({tab: "details"}).tab).toBe("details");
    expect(parseCourseRecordQuery({tab: "waitlist", show: "past"})).toMatchObject({
      tab: "waitlist",
      show: "past",
    });
  });

  it("treats enrolment filters as the enrolments view", () => {
    expect(parseCourseRecordQuery({q: "marie"}).tab).toBe("enrolments");
    expect(parseCourseRecordQuery({status: "PAID"}).tab).toBe("enrolments");
  });

  it("ignores an unknown tab or show", () => {
    expect(parseCourseRecordQuery({tab: "calendar", show: "soon"})).toMatchObject({
      tab: "sessions",
      show: "all",
    });
  });
});

describe("courseDetailHref", () => {
  it("keeps the default schedule URL clean", () => {
    expect(courseDetailHref("omni-practitioner")).toEqual({
      pathname: "/admin/courses/[id]",
      params: {id: "omni-practitioner"},
      query: {
        tab: undefined,
        show: undefined,
        q: undefined,
        session: undefined,
        status: undefined,
      },
    });
  });

  it("drops the other view's filters when switching tabs", () => {
    expect(
      courseDetailHref("omni-practitioner", {
        tab: "sessions",
        show: "upcoming",
        q: "marie",
        status: "PAID",
      }),
    ).toMatchObject({
      query: {show: "upcoming", q: undefined, status: undefined},
    });
  });
});

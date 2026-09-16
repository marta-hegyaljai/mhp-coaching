import {describe, expect, it} from "vitest";

import {
  adviceHref,
  courseAdvice,
  generalAdvice,
  parseAdviceQuery,
} from "./advice-route";

describe("parseAdviceQuery", () => {
  it("defaults to the call mode with no preselected date", () => {
    expect(parseAdviceQuery({})).toEqual({mode: "call", date: undefined});
  });

  it("accepts the write mode and a valid date", () => {
    expect(parseAdviceQuery({mode: "write", date: "2026-09-14"})).toEqual({
      mode: "write",
      date: "2026-09-14",
    });
  });

  it("falls back to the call mode for an unknown mode", () => {
    expect(parseAdviceQuery({mode: "telepathy"}).mode).toBe("call");
  });

  it("drops a date that is not an ISO calendar day", () => {
    for (const date of ["14-09-2026", "2026-13-01", "2026-02-30", "", "today"]) {
      expect(parseAdviceQuery({date}).date, date).toBeUndefined();
    }
  });

  it("reads the first value when a parameter is repeated", () => {
    expect(parseAdviceQuery({mode: ["write", "call"], date: ["2026-09-14"]})).toEqual({
      mode: "write",
      date: "2026-09-14",
    });
  });
});

describe("adviceHref", () => {
  it("keeps the course slug for course advice", () => {
    expect(adviceHref(courseAdvice("omni-hypnosis-practitioner"))).toEqual({
      pathname: "/courses/[slug]/advice",
      params: {slug: "omni-hypnosis-practitioner"},
      query: {},
    });
  });

  it("points at the standalone page for general advice", () => {
    expect(adviceHref(generalAdvice)).toEqual({pathname: "/advice", query: {}});
  });

  it("omits the defaults so shared links stay clean", () => {
    expect(adviceHref(generalAdvice, {mode: "call"})).toEqual({
      pathname: "/advice",
      query: {},
    });
  });

  it("carries the mode and date for both targets", () => {
    expect(adviceHref(generalAdvice, {mode: "write", date: "2026-09-14"})).toEqual({
      pathname: "/advice",
      query: {mode: "write", date: "2026-09-14"},
    });
    expect(adviceHref(courseAdvice("a-course"), {mode: "write"})).toEqual({
      pathname: "/courses/[slug]/advice",
      params: {slug: "a-course"},
      query: {mode: "write"},
    });
  });
});

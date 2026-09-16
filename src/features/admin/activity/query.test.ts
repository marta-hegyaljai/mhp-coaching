import {describe, expect, it} from "vitest";

import {
  ACTIVITY_MAX_PAGE,
  activityFilterHref,
  activityHref,
  activityPageHref,
  parseActivityQuery,
} from "./query";

describe("parseActivityQuery", () => {
  it("defaults to today across every channel", () => {
    expect(parseActivityQuery({})).toEqual({
      when: "today",
      kind: "all",
      q: "",
      page: 1,
    });
  });

  it("reads a valid window, channel, search and page", () => {
    expect(
      parseActivityQuery({when: "history", kind: "waitlist", q: "  ada  ", page: "3"}),
    ).toEqual({when: "history", kind: "waitlist", q: "ada", page: 3});
  });

  it("falls back on unknown windows and channels instead of throwing", () => {
    expect(parseActivityQuery({when: "tomorrow", kind: "invoices"})).toMatchObject({
      when: "today",
      kind: "all",
    });
  });

  it("takes the first value of a repeated parameter", () => {
    expect(
      parseActivityQuery({when: ["upcoming", "history"], kind: ["call", "message"]}),
    ).toMatchObject({when: "upcoming", kind: "call"});
  });

  it("rejects non-positive, fractional and non-numeric pages", () => {
    for (const page of ["0", "-2", "abc", "", "1.5e400"]) {
      expect(parseActivityQuery({page}).page).toBe(1);
    }
  });

  it("caps the page so the per-channel read depth stays bounded", () => {
    expect(parseActivityQuery({page: "999999"}).page).toBe(ACTIVITY_MAX_PAGE);
  });

  it("caps the search length", () => {
    expect(parseActivityQuery({q: "a".repeat(500)}).q).toHaveLength(80);
  });
});

describe("activityHref", () => {
  it("keeps the default view on a clean path", () => {
    expect(activityHref()).toEqual({pathname: "/admin/overview", query: {}});
  });

  it("serializes only what differs from the default", () => {
    expect(activityHref({when: "history", kind: "message", q: "ada", page: 2})).toEqual({
      pathname: "/admin/overview",
      query: {when: "history", kind: "message", q: "ada", page: "2"},
    });
  });

  it("returns to the first page when the window or channel changes", () => {
    const query = {when: "history", kind: "message", q: "ada", page: 4} as const;

    expect(activityFilterHref(query, {when: "upcoming"})).toEqual({
      pathname: "/admin/overview",
      query: {when: "upcoming", kind: "message", q: "ada"},
    });
  });

  it("keeps the window, channel and search while paging", () => {
    const query = {when: "history", kind: "waitlist", q: "ada", page: 1} as const;

    expect(activityPageHref(query, 3)).toEqual({
      pathname: "/admin/overview",
      query: {when: "history", kind: "waitlist", q: "ada", page: "3"},
    });
  });
});

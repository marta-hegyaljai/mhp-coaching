import {describe, expect, it} from "vitest";

import {
  ACTIVITY_MAX_PAGE,
  activityFilterHref,
  activityHistoryPageHref,
  activityHref,
  parseActivityQuery,
} from "./query";

describe("parseActivityQuery", () => {
  it("defaults to the live board with History on its first page", () => {
    expect(parseActivityQuery({})).toEqual({
      kind: "all",
      q: "",
      historyPage: 1,
    });
  });

  it("reads a channel, search and History page", () => {
    expect(
      parseActivityQuery({kind: "waitlist", q: "  ada  ", hp: "3"}),
    ).toEqual({kind: "waitlist", q: "ada", historyPage: 3});
  });

  it("maps a legacy History deep link onto the History page", () => {
    expect(parseActivityQuery({when: "history", page: "4"})).toMatchObject({
      historyPage: 4,
    });
  });

  it("falls back on unknown channels instead of throwing", () => {
    expect(parseActivityQuery({kind: "invoices"})).toMatchObject({kind: "all"});
  });

  it("takes the first value of a repeated parameter", () => {
    expect(parseActivityQuery({kind: ["call", "message"]})).toMatchObject({
      kind: "call",
    });
  });

  it("rejects non-positive, fractional and non-numeric History pages", () => {
    for (const hp of ["0", "-2", "abc", "", "1.5e400"]) {
      expect(parseActivityQuery({hp}).historyPage).toBe(1);
    }
  });

  it("caps the page so the per-channel read depth stays bounded", () => {
    expect(parseActivityQuery({hp: "999999"}).historyPage).toBe(ACTIVITY_MAX_PAGE);
  });

  it("caps the search length", () => {
    expect(parseActivityQuery({q: "a".repeat(500)}).q).toHaveLength(80);
  });
});

describe("activityHref", () => {
  it("keeps the default board on a clean path", () => {
    expect(activityHref()).toEqual({pathname: "/admin/overview", query: {}});
  });

  it("serializes only what differs from the default", () => {
    expect(activityHref({kind: "message", q: "ada", historyPage: 2})).toEqual({
      pathname: "/admin/overview",
      query: {kind: "message", q: "ada", hp: "2"},
    });
  });

  it("returns History to the first page when the channel changes", () => {
    const query = {kind: "message", q: "ada", historyPage: 4} as const;

    expect(activityFilterHref(query, {kind: "waitlist"})).toEqual({
      pathname: "/admin/overview",
      query: {kind: "waitlist", q: "ada"},
    });
  });

  it("keeps the channel and search while paging History", () => {
    const query = {kind: "waitlist", q: "ada", historyPage: 1} as const;

    expect(activityHistoryPageHref(query, 3)).toEqual({
      pathname: "/admin/overview",
      query: {kind: "waitlist", q: "ada", hp: "3"},
    });
  });
});

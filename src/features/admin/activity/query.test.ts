import {describe, expect, it} from "vitest";

import {addLocalDays, todayInZurich} from "@/features/rooms/timezone";

import {
  ACTIVITY_MAX_PAGE,
  activityFilterHref,
  activityFocusDay,
  activityHistoryPageHref,
  activityHref,
  defaultActivityQuery,
  parseActivityQuery,
  showsCancelledActivity,
} from "./query";

const now = new Date("2026-09-19T10:00:00.000Z");
const today = todayInZurich(now);
const yesterday = addLocalDays(today, -1);

describe("parseActivityQuery", () => {
  it("defaults to the live board with History on its first page", () => {
    expect(parseActivityQuery({}, now)).toEqual({
      kind: "all",
      q: "",
      historyPage: 1,
      day: null,
      showUpcomingCancelled: false,
      showHistoryCancelled: false,
      window: "today",
    });
  });

  it("reads a channel, search and History page", () => {
    expect(
      parseActivityQuery({kind: "waitlist", q: "  ada  ", hp: "3"}, now),
    ).toEqual({
      kind: "waitlist",
      q: "ada",
      historyPage: 3,
      day: null,
      showUpcomingCancelled: false,
      showHistoryCancelled: false,
      window: "today",
    });
  });

  it("maps a legacy History deep link onto the History page", () => {
    expect(parseActivityQuery({when: "history", page: "4"})).toMatchObject({
      historyPage: 4,
      window: "history",
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

  it("reads a chosen Zurich day and the cancelled-row flags", () => {
    expect(
      parseActivityQuery({day: yesterday, uc: "1", hc: "1"}, now),
    ).toEqual({
      kind: "all",
      q: "",
      historyPage: 1,
      day: yesterday,
      showUpcomingCancelled: true,
      showHistoryCancelled: true,
      window: "today",
    });
  });

  it("reads a chosen pane and falls back to Today", () => {
    expect(parseActivityQuery({when: "upcoming"}, now).window).toBe("upcoming");
    expect(parseActivityQuery({when: "history"}, now).window).toBe("history");
    expect(parseActivityQuery({when: "today"}, now).window).toBe("today");
    expect(parseActivityQuery({when: "later"}, now).window).toBe("today");
  });

  it("drops today and junk days so the default board stays a clean path", () => {
    expect(parseActivityQuery({day: today}, now).day).toBeNull();
    expect(parseActivityQuery({day: "2026-13-40"}, now).day).toBeNull();
    expect(parseActivityQuery({uc: "yes", hc: "true"}, now)).toMatchObject({
      showUpcomingCancelled: false,
      showHistoryCancelled: false,
    });
  });
});

describe("activityHref", () => {
  it("keeps the default board on a clean path", () => {
    expect(activityHref()).toEqual({pathname: "/admin/overview", query: {}});
  });

  it("serializes only what differs from the default", () => {
    expect(activityHref({kind: "message", q: "ada", historyPage: 2}, now)).toEqual({
      pathname: "/admin/overview",
      query: {kind: "message", q: "ada", hp: "2"},
    });
  });

  it("serializes a chosen day and cancelled flags", () => {
    expect(
      activityHref(
        {
          day: yesterday,
          showUpcomingCancelled: true,
          showHistoryCancelled: true,
        },
        now,
      ),
    ).toEqual({
      pathname: "/admin/overview",
      query: {day: yesterday, uc: "1", hc: "1"},
    });
  });

  it("omits the current Zurich day from the path", () => {
    expect(activityHref({day: today}, now)).toEqual({
      pathname: "/admin/overview",
      query: {},
    });
  });

  it("serializes a non-Today pane and keeps Today off the path", () => {
    expect(activityHref({window: "upcoming"}, now)).toEqual({
      pathname: "/admin/overview",
      query: {when: "upcoming"},
    });
    expect(activityHref({window: "history", historyPage: 2}, now)).toEqual({
      pathname: "/admin/overview",
      query: {when: "history", hp: "2"},
    });
    expect(activityHref({window: "today"}, now)).toEqual({
      pathname: "/admin/overview",
      query: {},
    });
  });

  it("returns History to the first page when the channel changes", () => {
    const query = {
      ...defaultActivityQuery,
      kind: "message" as const,
      q: "ada",
      historyPage: 4,
    };

    expect(activityFilterHref(query, {kind: "waitlist"})).toEqual({
      pathname: "/admin/overview",
      query: {kind: "waitlist", q: "ada"},
    });
  });

  it("keeps the channel and search while paging History", () => {
    const query = {
      ...defaultActivityQuery,
      kind: "waitlist" as const,
      q: "ada",
      historyPage: 1,
    };

    expect(activityHistoryPageHref(query, 3)).toEqual({
      pathname: "/admin/overview",
      query: {kind: "waitlist", q: "ada", hp: "3"},
    });
  });
});

describe("activityFocusDay", () => {
  it("uses the chosen day, or the current Zurich day", () => {
    expect(activityFocusDay({...defaultActivityQuery, day: yesterday}, now)).toBe(
      yesterday,
    );
    expect(activityFocusDay(defaultActivityQuery, now)).toBe(today);
  });
});

describe("showsCancelledActivity", () => {
  it("reads each pane independently", () => {
    const query = {
      ...defaultActivityQuery,
      showUpcomingCancelled: true,
    };

    expect(showsCancelledActivity(query, "upcoming")).toBe(true);
    expect(showsCancelledActivity(query, "history")).toBe(false);
  });
});

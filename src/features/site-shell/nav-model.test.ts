import {describe, expect, it} from "vitest";

import type {Viewer} from "@/features/auth/require";

import {accountNavEntries, primaryNavEntries} from "./nav-model";

function viewer(overrides: Partial<Viewer> = {}): Viewer {
  return {
    id: "user-1",
    email: "person@example.test",
    firstName: "Nav",
    lastName: "Review",
    isAdmin: false,
    canAccessRooms: false,
    canAccessStaffLists: false,
    ...overrides,
  };
}

const keys = (entries: {key: string}[]) => entries.map((entry) => entry.key);

describe("primaryNavEntries", () => {
  it("shows visitors and course-only accounts the public sections only", () => {
    expect(keys(primaryNavEntries(null))).toEqual(["courses", "contact"]);
    expect(keys(primaryNavEntries(viewer()))).toEqual(["courses", "contact"]);
  });

  it("adds a section per granted capability, never a locked decoy", () => {
    expect(keys(primaryNavEntries(viewer({canAccessRooms: true})))).toEqual([
      "courses",
      "contact",
      "rooms",
    ]);
    expect(keys(primaryNavEntries(viewer({isAdmin: true})))).toEqual([
      "courses",
      "contact",
      "admin",
    ]);
    expect(
      keys(primaryNavEntries(viewer({isAdmin: true, canAccessRooms: true}))),
    ).toEqual(["courses", "contact", "rooms", "admin"]);
  });

  it("keeps public sections on the marketing origin and capabilities on the app", () => {
    const entries = primaryNavEntries(viewer({isAdmin: true, canAccessRooms: true}));

    expect(entries.filter((entry) => entry.origin === "marketing").map((e) => e.key)).toEqual([
      "courses",
      "contact",
    ]);
    expect(entries.filter((entry) => entry.origin === "app").map((e) => e.key)).toEqual([
      "rooms",
      "admin",
    ]);
  });
});

describe("accountNavEntries", () => {
  it("keeps personal destinations out of the product navigation", () => {
    expect(keys([...accountNavEntries])).toEqual(["account", "myCourses"]);
    expect(primaryNavEntries(viewer()).map((entry) => entry.key)).not.toContain("account");
  });

  it("matches the profile route exactly so My courses can own its own row", () => {
    const profile = accountNavEntries.find((entry) => entry.key === "account");
    expect(profile?.exact).toBe(true);
  });
});

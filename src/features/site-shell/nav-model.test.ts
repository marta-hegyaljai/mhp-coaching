import {describe, expect, it} from "vitest";

import type {Viewer} from "@/features/auth/require";

import {
  accountNavEntries,
  isNavGroup,
  primaryNavEntries,
  primaryNavNodes,
} from "./nav-model";

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

describe("primaryNavNodes", () => {
  it("keeps the bar down to the course list plus one grouped control", () => {
    expect(keys(primaryNavNodes(null))).toEqual(["courses", "school"]);
    expect(keys(primaryNavNodes(viewer()))).toEqual(["courses", "school"]);
  });

  it("groups the secondary destinations behind the school control", () => {
    const group = primaryNavNodes(null).find(isNavGroup);

    expect(group?.key).toBe("school");
    expect(keys(group?.entries ?? [])).toEqual([
      "caseLibrary",
      "insights",
      "about",
      "gallery",
      "contact",
    ]);
  });

  it("explains every grouped destination so the menu can be scanned", () => {
    const group = primaryNavNodes(null).find(isNavGroup);

    for (const entry of group?.entries ?? []) {
      expect(entry.hint, entry.key).toBe(`${entry.key}Hint`);
    }
  });

  it("keeps granted capabilities as their own chips, never inside the group", () => {
    const nodes = primaryNavNodes(viewer({isAdmin: true, canAccessRooms: true}));

    expect(keys(nodes)).toEqual(["courses", "school", "rooms", "admin"]);
    expect(keys(nodes.find(isNavGroup)?.entries ?? [])).not.toContain("admin");
  });
});

describe("primaryNavEntries", () => {
  it("flattens every public destination for the phone sheet and the footer", () => {
    expect(keys(primaryNavEntries(null))).toEqual([
      "courses",
      "caseLibrary",
      "insights",
      "about",
      "gallery",
      "contact",
    ]);
    expect(keys(primaryNavEntries(viewer()))).toEqual([
      "courses",
      "caseLibrary",
      "insights",
      "about",
      "gallery",
      "contact",
    ]);
  });

  it("adds a section per granted capability, never a locked decoy", () => {
    expect(keys(primaryNavEntries(viewer({canAccessRooms: true})))).toEqual([
      "courses",
      "caseLibrary",
      "insights",
      "about",
      "gallery",
      "contact",
      "rooms",
    ]);
    expect(keys(primaryNavEntries(viewer({isAdmin: true})))).toEqual([
      "courses",
      "caseLibrary",
      "insights",
      "about",
      "gallery",
      "contact",
      "admin",
    ]);
    expect(
      keys(primaryNavEntries(viewer({isAdmin: true, canAccessRooms: true}))),
    ).toEqual([
      "courses",
      "caseLibrary",
      "insights",
      "about",
      "gallery",
      "contact",
      "rooms",
      "admin",
    ]);
  });

  it("keeps public sections on the marketing origin and capabilities on the app", () => {
    const entries = primaryNavEntries(viewer({isAdmin: true, canAccessRooms: true}));

    expect(entries.filter((entry) => entry.origin === "marketing").map((e) => e.key)).toEqual([
      "courses",
      "caseLibrary",
      "insights",
      "about",
      "gallery",
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

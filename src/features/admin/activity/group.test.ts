import {describe, expect, it} from "vitest";

import {groupActivityEntries} from "./group";
import type {ActivityEntry, ActivityKind} from "./types";

function entry(
  kind: ActivityKind,
  id: string,
  occursAt: string,
): ActivityEntry {
  return {
    id: `${kind}:${id}`,
    kind,
    occursAt: new Date(occursAt),
    receivedAt: new Date(occursAt),
    scheduled: true,
    when: {dateLabel: occursAt.slice(0, 10), timeLabel: "10:00"},
    person: id,
    personDetail: `${id}@example.test`,
    title: id,
    detail: null,
    status: null,
    href: null,
    source: {kind: "change", eventId: id},
  };
}

describe("groupActivityEntries", () => {
  it("keeps Today as one unnamed block so the heading does not repeat the window", () => {
    const groups = groupActivityEntries(
      [
        entry("call", "morning", "2026-09-17T08:00:00.000Z"),
        entry("reservation", "afternoon", "2026-09-17T12:00:00.000Z"),
      ],
      "today",
      "en",
      "2026-09-17",
      "Today",
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.key).toBe("today");
    expect(groups[0]?.label).toBeNull();
    expect(groups[0]?.entries.map((row) => row.title)).toEqual(["morning", "afternoon"]);
  });

  it("splits later windows on the Zurich day and names today with the window label", () => {
    const groups = groupActivityEntries(
      [
        // 22:30 UTC on 16 September is already 00:30 on the 17th in Zurich.
        entry("call", "late", "2026-09-16T22:30:00.000Z"),
        entry("call", "morning", "2026-09-17T08:00:00.000Z"),
        entry("reservation", "next", "2026-09-18T07:00:00.000Z"),
      ],
      "upcoming",
      "en",
      "2026-09-17",
      "Today",
    );

    expect(groups.map((group) => [group.key, group.label])).toEqual([
      ["2026-09-17", "Today"],
      ["2026-09-18", "Friday, 18 September 2026"],
    ]);
    expect(groups[0]?.entries.map((row) => row.title)).toEqual(["late", "morning"]);
    expect(groups[1]?.entries.map((row) => row.title)).toEqual(["next"]);
  });

  it("localizes a day heading that is not today", () => {
    const groups = groupActivityEntries(
      [entry("message", "note", "2026-09-10T09:00:00.000Z")],
      "history",
      "fr",
      "2026-09-17",
      "Aujourd’hui",
    );

    expect(groups[0]?.label).toBe("jeudi, 10 septembre 2026");
  });

  it("returns nothing when the page is empty", () => {
    expect(
      groupActivityEntries([], "history", "en", "2026-09-17", "Today"),
    ).toEqual([]);
  });
});

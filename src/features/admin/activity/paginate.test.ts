import {describe, expect, it} from "vitest";

import {mergeActivityPage, type ChannelResult} from "./paginate";
import {ACTIVITY_KINDS, type ActivityEntry, type ActivityKind} from "./types";

function entry(
  kind: ActivityKind,
  id: string,
  occursAt: string,
  receivedAt = occursAt,
): ActivityEntry {
  return {
    id: `${kind}:${id}`,
    kind,
    occursAt: new Date(occursAt),
    receivedAt: new Date(receivedAt),
    scheduled: kind === "registration" || kind === "reservation" || kind === "call",
    when: {dateLabel: occursAt.slice(0, 10), timeLabel: null},
    person: id,
    personDetail: `${id}@example.test`,
    title: id,
    detail: null,
    status: null,
    href: null,
    source: {kind: "change", eventId: id},
  };
}

function channel(kind: ActivityKind, entries: ActivityEntry[]): ChannelResult {
  return {kind, result: {entries, total: entries.length}};
}

const all = () => true;

describe("mergeActivityPage", () => {
  it("interleaves channels by the moment that matters when looking forward", () => {
    const merged = mergeActivityPage({
      results: [
        channel("reservation", [
          entry("reservation", "room-a", "2026-09-16T08:00:00.000Z"),
          entry("reservation", "room-b", "2026-09-16T14:00:00.000Z"),
        ]),
        channel("call", [entry("call", "advice", "2026-09-16T10:00:00.000Z")]),
      ],
      isSelected: all,
      when: "upcoming",
      page: 1,
      pageSize: 10,
      maxPage: 50,
    });

    expect(merged.page.entries.map((row) => row.title)).toEqual([
      "room-a",
      "advice",
      "room-b",
    ]);
  });

  it("reads history backwards from the moment each row is labelled with", () => {
    const merged = mergeActivityPage({
      results: [
        // A course that ran long ago, even though it was booked only yesterday:
        // the reader sees the course date, so it must sort on the course date.
        channel("registration", [
          entry(
            "registration",
            "old-course",
            "2025-01-10T00:00:00.000Z",
            "2026-09-15T09:00:00.000Z",
          ),
        ]),
        channel("message", [entry("message", "question", "2026-09-10T09:00:00.000Z")]),
      ],
      isSelected: all,
      when: "history",
      page: 1,
      pageSize: 10,
      maxPage: 50,
    });

    expect(merged.page.entries.map((row) => row.title)).toEqual([
      "question",
      "old-course",
    ]);
  });

  it("pages the merged timeline without repeating or skipping a row", () => {
    const rows = Array.from({length: 6}, (_, index) =>
      entry("reservation", `r${index}`, `2026-09-16T0${index}:00:00.000Z`),
    );
    const results = [channel("reservation", rows)];
    const first = mergeActivityPage({
      results,
      isSelected: all,
      when: "upcoming",
      page: 1,
      pageSize: 2,
      maxPage: 50,
    });
    const second = mergeActivityPage({
      results,
      isSelected: all,
      when: "upcoming",
      page: 2,
      pageSize: 2,
      maxPage: 50,
    });

    expect(first.page.entries.map((row) => row.title)).toEqual(["r0", "r1"]);
    expect(second.page.entries.map((row) => row.title)).toEqual(["r2", "r3"]);
    expect(first.page.pageCount).toBe(3);
  });

  it("orders deterministically when two channels share the same instant", () => {
    const same = "2026-09-16T10:00:00.000Z";
    const forward = () => [
      channel("call", [entry("call", "advice", same)]),
      channel("reservation", [entry("reservation", "room", same)]),
    ];
    const reversed = () => forward().reverse();

    const left = mergeActivityPage({
      results: forward(),
      isSelected: all,
      when: "upcoming",
      page: 1,
      pageSize: 10,
      maxPage: 50,
    });
    const right = mergeActivityPage({
      results: reversed(),
      isSelected: all,
      when: "upcoming",
      page: 1,
      pageSize: 10,
      maxPage: 50,
    });

    expect(left.page.entries.map((row) => row.id)).toEqual(
      right.page.entries.map((row) => row.id),
    );
  });

  it("counts every channel but lists only the selected one", () => {
    const merged = mergeActivityPage({
      results: [
        channel("waitlist", [entry("waitlist", "ada", "2026-09-16T08:00:00.000Z")]),
        channel("message", [entry("message", "sam", "2026-09-16T09:00:00.000Z")]),
      ],
      isSelected: (kind) => kind === "waitlist",
      when: "history",
      page: 1,
      pageSize: 10,
      maxPage: 50,
    });

    expect(merged.page.entries.map((row) => row.title)).toEqual(["ada"]);
    expect(merged.page.total).toBe(1);
    expect(merged.windowTotal).toBe(2);
    expect(merged.counts.message).toBe(1);
    expect(merged.counts.waitlist).toBe(1);
  });

  it("reports zero for channels that returned nothing", () => {
    const merged = mergeActivityPage({
      results: [],
      isSelected: all,
      when: "today",
      page: 1,
      pageSize: 10,
      maxPage: 50,
    });

    for (const kind of ACTIVITY_KINDS) {
      expect(merged.counts[kind]).toBe(0);
    }
    expect(merged.page).toMatchObject({total: 0, page: 1, pageCount: 1, entries: []});
  });

  it("never advertises a page deeper than the channels were read", () => {
    const rows = Array.from({length: 40}, (_, index) =>
      entry("change", `e${index}`, `2026-09-16T00:00:${String(index).padStart(2, "0")}.000Z`),
    );

    const merged = mergeActivityPage({
      // 10 000 total rows would be 500 pages, but only 3 are reachable.
      results: [{kind: "change", result: {entries: rows, total: 10_000}}],
      isSelected: all,
      when: "history",
      page: 1,
      pageSize: 20,
      maxPage: 3,
    });

    expect(merged.page.pageCount).toBe(3);
    expect(merged.page.total).toBe(10_000);
  });

  it("clamps a page beyond the end onto the last real page", () => {
    const rows = Array.from({length: 3}, (_, index) =>
      entry("call", `c${index}`, `2026-09-16T0${index}:00:00.000Z`),
    );

    const merged = mergeActivityPage({
      results: [channel("call", rows)],
      isSelected: all,
      when: "upcoming",
      page: 9,
      pageSize: 2,
      maxPage: 50,
    });

    expect(merged.page.page).toBe(2);
    expect(merged.page.entries.map((row) => row.title)).toEqual(["c2"]);
  });
});

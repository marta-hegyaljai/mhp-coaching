import {describe, expect, it} from "vitest";

import {availabilityHref, parseAvailabilityQuery} from "@/features/rooms/query";

describe("availability query", () => {
  it("drops a missing room instead of serializing undefined", () => {
    expect(availabilityHref({view: "week", date: "2026-09-14", roomIds: []})).toEqual({
      pathname: "/rooms",
      query: {view: "week", date: "2026-09-14"},
    });
    expect(
      availabilityHref({
        view: "day",
        date: "2026-09-14",
        roomIds: ["11111111-1111-4111-8111-111111111111"],
      }).query.rooms,
    ).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("ignores a non-UUID or literal undefined room filter", () => {
    expect(
      parseAvailabilityQuery({view: "week", date: "2026-09-14", room: "undefined"})
        .roomIds,
    ).toEqual([]);
    expect(parseAvailabilityQuery({view: "day", date: "not-a-date"}).date).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
  });

  it("keeps a unique multi-room subset from repeated or comma-separated values", () => {
    expect(
      parseAvailabilityQuery({
        view: "week",
        date: "2026-09-14",
        rooms: [
          "11111111-1111-4111-8111-111111111111,22222222-2222-4222-8222-222222222222",
          "11111111-1111-4111-8111-111111111111",
        ],
      }).roomIds,
    ).toEqual([
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
    ]);
  });
});

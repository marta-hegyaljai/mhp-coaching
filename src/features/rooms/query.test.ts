import {describe, expect, it} from "vitest";

import {availabilityHref, parseAvailabilityQuery} from "@/features/rooms/query";

describe("availability query", () => {
  it("drops a missing room instead of serializing undefined", () => {
    expect(availabilityHref({view: "week", date: "2026-09-14"})).toEqual({
      pathname: "/rooms",
      query: {view: "week", date: "2026-09-14"},
    });
    expect(
      availabilityHref({
        view: "day",
        date: "2026-09-14",
        roomId: "11111111-1111-4111-8111-111111111111",
      }).query.room,
    ).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("ignores a non-UUID or literal undefined room filter", () => {
    expect(parseAvailabilityQuery({view: "week", date: "2026-09-14", room: "undefined"}).roomId)
      .toBeUndefined();
    expect(parseAvailabilityQuery({view: "day", date: "not-a-date"}).date).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
  });
});

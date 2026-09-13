import {describe, expect, it} from "vitest";

import {
  effectiveRoomSelection,
  nextRoomFilterSelection,
} from "./room-filter-selection";

const allRoomIds = ["room-a", "room-b"];

describe("nextRoomFilterSelection", () => {
  it("narrows all rooms to one unchecked room", () => {
    expect(
      nextRoomFilterSelection({
        allRoomIds,
        selectedRoomIds: [],
        roomId: "room-a",
        checked: false,
      }),
    ).toEqual(["room-b"]);
  });

  it("expands a partial selection back to all rooms", () => {
    expect(
      nextRoomFilterSelection({
        allRoomIds,
        selectedRoomIds: ["room-a"],
        roomId: "room-b",
        checked: true,
      }),
    ).toEqual([]);
  });

  it("keeps a partial selection when one room is removed", () => {
    expect(
      nextRoomFilterSelection({
        allRoomIds,
        selectedRoomIds: ["room-a", "room-b"],
        roomId: "room-b",
        checked: false,
      }),
    ).toEqual(["room-a"]);
  });
});

describe("effectiveRoomSelection", () => {
  it("marks every room selected when the filter includes all rooms", () => {
    expect([...effectiveRoomSelection(allRoomIds, [])]).toEqual(allRoomIds);
  });
});

import {describe, expect, it} from "vitest";

import {
  partitionUpcomingSessions,
  UPCOMING_SESSION_PREVIEW_COUNT,
} from "./upcoming-sessions";

describe("partitionUpcomingSessions", () => {
  it("keeps three or fewer dates in the preview", () => {
    expect(partitionUpcomingSessions([1, 2])).toEqual({
      preview: [1, 2],
      extra: [],
    });
    expect(partitionUpcomingSessions([1, 2, 3])).toEqual({
      preview: [1, 2, 3],
      extra: [],
    });
  });

  it("holds later dates behind the preview when there are more than three", () => {
    expect(partitionUpcomingSessions([1, 2, 3, 4, 5])).toEqual({
      preview: [1, 2, 3],
      extra: [4, 5],
    });
    expect(UPCOMING_SESSION_PREVIEW_COUNT).toBe(3);
  });
});

import {describe, expect, it} from "vitest";

import {normalizeCallHours} from "./hours";
import {CourseCallError} from "./errors";

describe("call hours", () => {
  it("merges overlapping windows on the same weekday", () => {
    const intervals = normalizeCallHours([
      {
        weekday: 1,
        closed: false,
        intervals: [
          {startMinute: 9 * 60, endMinute: 12 * 60},
          {startMinute: 11 * 60, endMinute: 13 * 60},
        ],
      },
      {weekday: 2, closed: true, intervals: []},
      {weekday: 3, closed: true, intervals: []},
      {weekday: 4, closed: true, intervals: []},
      {weekday: 5, closed: true, intervals: []},
      {weekday: 6, closed: true, intervals: []},
      {weekday: 7, closed: true, intervals: []},
    ]);

    expect(intervals).toEqual([{weekday: 1, startMinute: 540, endMinute: 780}]);
  });

  it("rejects a window that is not aligned to 15 minutes", () => {
    expect(() =>
      normalizeCallHours([
        {
          weekday: 1,
          closed: false,
          intervals: [{startMinute: 9 * 60 + 5, endMinute: 12 * 60}],
        },
        {weekday: 2, closed: true, intervals: []},
        {weekday: 3, closed: true, intervals: []},
        {weekday: 4, closed: true, intervals: []},
        {weekday: 5, closed: true, intervals: []},
        {weekday: 6, closed: true, intervals: []},
        {weekday: 7, closed: true, intervals: []},
      ]),
    ).toThrow(CourseCallError);
  });
});

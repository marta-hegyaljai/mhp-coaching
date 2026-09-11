import {describe, expect, it} from "vitest";

import {bookHref, parseBookQuery} from "./book-query";

describe("book query", () => {
  it("keeps a valid room, date and clock and drops junk", () => {
    expect(
      parseBookQuery({
        room: "11111111-1111-4111-8111-111111111111",
        date: "2026-09-21",
        start: "10:00",
        end: "11:30",
      }),
    ).toEqual({
      roomId: "11111111-1111-4111-8111-111111111111",
      roomIds: [],
      date: "2026-09-21",
      start: "10:00",
      end: "11:30",
    });

    expect(
      parseBookQuery({
        room: "undefined",
        date: "not-a-date",
        start: "10:0",
        end: "25:00",
      }),
    ).toEqual({
      roomId: undefined,
      roomIds: [],
      date: undefined,
      start: undefined,
      end: undefined,
    });
  });

  it("keeps the available room choices on a calendar booking link", () => {
    const first = "11111111-1111-4111-8111-111111111111";
    const second = "22222222-2222-4222-8222-222222222222";
    const href = bookHref({
      roomId: first,
      roomIds: [first, second],
      date: "2026-09-21",
      start: "10:00",
    });

    expect(href.query.rooms).toBe(`${first},${second}`);
    expect(parseBookQuery(href.query).roomIds).toEqual([first, second]);
  });

  it("omits empty start and end from the book href", () => {
    expect(
      bookHref({
        roomId: "11111111-1111-4111-8111-111111111111",
        date: "2026-09-21",
      }),
    ).toEqual({
      pathname: "/rooms/book",
      query: {
        room: "11111111-1111-4111-8111-111111111111",
        date: "2026-09-21",
      },
    });
  });
});

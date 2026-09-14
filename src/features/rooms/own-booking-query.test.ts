import {describe, expect, it} from "vitest";

import {ownBookingListHref, parseOwnBookingQuery} from "./own-booking-query";

describe("parseOwnBookingQuery", () => {
  it("hides cancelled bookings unless status=all", () => {
    expect(parseOwnBookingQuery({})).toEqual({showCancelled: false, notice: null});
    expect(parseOwnBookingQuery({status: "all", cancelled: "1"})).toEqual({
      showCancelled: true,
      notice: "cancelled",
    });
    expect(parseOwnBookingQuery({reserved: "1"})).toEqual({
      showCancelled: false,
      notice: "reserved",
    });
  });
});

describe("ownBookingListHref", () => {
  it("omits the default hidden-cancelled list", () => {
    expect(ownBookingListHref({showCancelled: false, notice: null})).toBe("/rooms/bookings");
    expect(ownBookingListHref({showCancelled: true, notice: "cancelled"})).toEqual({
      pathname: "/rooms/bookings",
      query: {status: "all", cancelled: "1"},
    });
  });
});

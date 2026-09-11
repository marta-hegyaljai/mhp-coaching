import {describe, expect, it} from "vitest";

import {adminBookingDetailHref, parseAdminBookingAction} from "./admin-booking-action";

describe("parseAdminBookingAction", () => {
  it("accepts the supported decisions", () => {
    expect(parseAdminBookingAction("move")).toBe("move");
    expect(parseAdminBookingAction("cancel")).toBe("cancel");
    expect(parseAdminBookingAction("waive")).toBe("waive");
  });

  it("reads the first value of a repeated parameter", () => {
    expect(parseAdminBookingAction(["waive", "move"])).toBe("waive");
  });

  it("rejects anything else instead of guessing", () => {
    expect(parseAdminBookingAction(undefined)).toBeNull();
    expect(parseAdminBookingAction("")).toBeNull();
    expect(parseAdminBookingAction("delete")).toBeNull();
    expect(parseAdminBookingAction("MOVE")).toBeNull();
    expect(parseAdminBookingAction([])).toBeNull();
  });
});

describe("adminBookingDetailHref", () => {
  it("omits the query when no decision is open", () => {
    expect(adminBookingDetailHref("b-1")).toEqual({
      pathname: "/admin/bookings/[id]",
      params: {id: "b-1"},
    });
  });

  it("carries the decision so a confirmation step is linkable", () => {
    expect(adminBookingDetailHref("b-1", "cancel")).toEqual({
      pathname: "/admin/bookings/[id]",
      params: {id: "b-1"},
      query: {action: "cancel"},
    });
  });
});

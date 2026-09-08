import {describe, expect, it} from "vitest";

import {reduceBookingStatus} from "./status";

describe("reduceBookingStatus", () => {
  it("never leaves a paid booking", () => {
    expect(reduceBookingStatus("PAID", "cancelled")).toEqual({
      next: "PAID",
      apply: false,
    });
    expect(reduceBookingStatus("PAID", "failed")).toEqual({
      next: "PAID",
      apply: false,
    });
    expect(reduceBookingStatus("PAID", "paid")).toEqual({
      next: "PAID",
      apply: false,
    });
  });

  it("marks a pending booking paid exactly when a paid event arrives", () => {
    expect(reduceBookingStatus("PENDING", "paid")).toEqual({
      next: "PAID",
      apply: true,
    });
    expect(reduceBookingStatus("PENDING", "cancelled")).toEqual({
      next: "CANCELLED",
      apply: true,
    });
  });
});

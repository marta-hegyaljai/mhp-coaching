import {describe, expect, it} from "vitest";

import {
  billingCopyKey,
  cancellationOutcome,
  chargeableAmountMinor,
  isFreeCancellation,
} from "./billing";

const noticeHours = 48;
const now = new Date("2026-09-11T10:00:00.000Z");

describe("cancellation notice window", () => {
  it("is free when the start is more than the notice hours away", () => {
    const startsAt = new Date("2026-09-14T10:00:01.000Z");
    expect(isFreeCancellation(startsAt, now, noticeHours)).toBe(true);
    expect(cancellationOutcome(startsAt, now, noticeHours)).toBe("FREE_CANCELLATION");
  });

  it("is late when the start is inside the notice window", () => {
    const startsAt = new Date("2026-09-13T10:00:00.000Z");
    expect(isFreeCancellation(startsAt, now, noticeHours)).toBe(false);
    expect(cancellationOutcome(startsAt, now, noticeHours)).toBe("LATE_CANCELLATION");
  });

  it("is late at the exact notice boundary", () => {
    const startsAt = new Date("2026-09-13T10:00:00.000Z");
    expect(isFreeCancellation(startsAt, now, noticeHours)).toBe(false);
  });

  it("treats a zero notice as free until the start instant", () => {
    const future = new Date("2026-09-11T10:00:01.000Z");
    const past = new Date("2026-09-11T09:59:59.000Z");
    expect(isFreeCancellation(future, now, 0)).toBe(true);
    expect(isFreeCancellation(past, now, 0)).toBe(false);
  });
});

describe("chargeable amount", () => {
  it("keeps the snapshot for confirmed use and late cancellation", () => {
    expect(
      chargeableAmountMinor({
        status: "CONFIRMED",
        billingOutcome: "USAGE",
        amountMinor: 5250,
      }),
    ).toBe(5250);
    expect(
      chargeableAmountMinor({
        status: "CANCELLED",
        billingOutcome: "LATE_CANCELLATION",
        amountMinor: 5250,
      }),
    ).toBe(5250);
  });

  it("is zero for free cancellation and waiver", () => {
    expect(
      chargeableAmountMinor({
        status: "CANCELLED",
        billingOutcome: "FREE_CANCELLATION",
        amountMinor: 5250,
      }),
    ).toBe(0);
    expect(
      chargeableAmountMinor({
        status: "CANCELLED",
        billingOutcome: "WAIVED",
        amountMinor: 5250,
      }),
    ).toBe(0);
  });
});

describe("billing copy", () => {
  it("maps outcomes to display keys", () => {
    expect(billingCopyKey({status: "CONFIRMED", billingOutcome: "USAGE"})).toBe("billingUsage");
    expect(
      billingCopyKey({status: "CANCELLED", billingOutcome: "FREE_CANCELLATION"}),
    ).toBe("billingFree");
    expect(
      billingCopyKey({status: "CANCELLED", billingOutcome: "LATE_CANCELLATION"}),
    ).toBe("billingLate");
    expect(billingCopyKey({status: "CANCELLED", billingOutcome: "WAIVED"})).toBe("billingWaived");
  });
});

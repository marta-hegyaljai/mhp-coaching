import {describe, expect, it} from "vitest";

import {bookingSpanLabel, bookingStamp, bookingWhen} from "./format";

const zurich = (iso: string) => new Date(iso);

describe("bookingWhen", () => {
  it("renders a localized day and a tabular time range", () => {
    const when = bookingWhen(
      zurich("2026-09-14T06:00:00.000Z"),
      zurich("2026-09-14T08:00:00.000Z"),
      "en",
    );

    expect(when.dateLabel).toBe("Monday, 14 September 2026");
    expect(when.timeLabel).toBe("08:00–10:00");
  });

  it("localizes the day for every supported locale", () => {
    const args = [zurich("2026-09-14T06:00:00.000Z"), zurich("2026-09-14T08:00:00.000Z")] as const;

    expect(bookingWhen(...args, "fr").dateLabel).toBe("lundi, 14 septembre 2026");
    expect(bookingWhen(...args, "de").dateLabel).toBe("Montag, 14. September 2026");
  });

  it("can drop the weekday for dense rows", () => {
    const when = bookingWhen(
      zurich("2026-09-14T06:00:00.000Z"),
      zurich("2026-09-14T08:00:00.000Z"),
      "en",
      {weekday: false},
    );

    expect(when.dateLabel).toBe("14 September 2026");
  });

  it("closes a booking that ends at midnight on the starting day", () => {
    const when = bookingWhen(
      zurich("2026-09-14T20:00:00.000Z"),
      zurich("2026-09-14T22:00:00.000Z"),
      "en",
    );

    expect(when.dateLabel).toBe("Monday, 14 September 2026");
    expect(when.timeLabel).toBe("22:00–24:00");
  });

  it("names the closing day when a booking really spans two days", () => {
    const when = bookingWhen(
      zurich("2026-09-14T21:00:00.000Z"),
      zurich("2026-09-14T23:00:00.000Z"),
      "en",
    );

    expect(when.timeLabel).toBe("23:00 – 15 September 2026 01:00");
  });

  it("keeps winter bookings on Zurich wall-clock time", () => {
    const when = bookingWhen(
      zurich("2026-01-12T07:00:00.000Z"),
      zurich("2026-01-12T08:00:00.000Z"),
      "en",
    );

    expect(when.dateLabel).toBe("Monday, 12 January 2026");
    expect(when.timeLabel).toBe("08:00–09:00");
  });
});

describe("bookingStamp", () => {
  it("prints a readable date and a Zurich time, never an ISO string", () => {
    const stamp = bookingStamp(zurich("2026-09-14T12:05:00.000Z"), "en");

    expect(stamp).toBe("14 September 2026, 14:05");
    expect(stamp).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

describe("bookingSpanLabel", () => {
  it("joins the day and the range for one history line", () => {
    expect(
      bookingSpanLabel(
        zurich("2026-09-14T06:00:00.000Z"),
        zurich("2026-09-14T07:30:00.000Z"),
        "en",
      ),
    ).toBe("14 September 2026 · 08:00–09:30");
  });
});

import {describe, expect, it} from "vitest";

import {
  adminBookingListHref,
  adminBookingListHrefForPage,
  parseAdminBookingQuery,
  showsCancelledBookings,
} from "./admin-booking-query";
import {localizedPathname} from "@/i18n/path";

const now = new Date("2026-09-14T10:00:00.000Z");

describe("parseAdminBookingQuery", () => {
  it("hides cancelled bookings and stays on the list by default", () => {
    expect(parseAdminBookingQuery({}, now)).toEqual({
      q: "",
      status: "CONFIRMED",
      view: "list",
      date: "2026-09-14",
      page: 1,
    });
    expect(parseAdminBookingQuery({status: "nope", view: "week", page: "0"}, now)).toEqual({
      q: "",
      status: "CONFIRMED",
      view: "list",
      date: "2026-09-14",
      page: 1,
    });
  });

  it("accepts show-cancelled, a day view and a Zurich date", () => {
    expect(
      parseAdminBookingQuery(
        {
          q: ["  Ada@MHP.ch  ", "ignored"],
          status: "all",
          view: "day",
          date: "2026-09-15",
          page: "3",
        },
        now,
      ),
    ).toEqual({
      q: "Ada@MHP.ch",
      status: "all",
      view: "day",
      date: "2026-09-15",
      page: 3,
    });
  });

  it("falls back to today when the date is invalid", () => {
    expect(parseAdminBookingQuery({view: "day", date: "14-09-2026"}, now).date).toBe(
      "2026-09-14",
    );
  });
});

describe("adminBookingListHref", () => {
  it("omits the confirmed list defaults so the index URL stays clean", () => {
    expect(
      adminBookingListHref({
        q: "",
        status: "CONFIRMED",
        view: "list",
        date: "2026-09-14",
        page: 1,
      }),
    ).toBe("/admin/bookings");
    expect(
      adminBookingListHref({
        q: "ada",
        status: "all",
        view: "day",
        date: "2026-09-15",
        page: 2,
      }),
    ).toEqual({
      pathname: "/admin/bookings",
      query: {q: "ada", status: "all", view: "day", date: "2026-09-15"},
    });
    expect(
      localizedPathname(
        "fr",
        adminBookingListHrefForPage(
          {
            q: "ada",
            status: "CONFIRMED",
            view: "list",
            date: "2026-09-14",
            page: 1,
          },
          4,
        ),
      ),
    ).toBe("/fr/admin/bookings?q=ada&page=4");
  });
});

describe("showsCancelledBookings", () => {
  it("treats anything but the confirmed filter as including cancelled rows", () => {
    expect(showsCancelledBookings("CONFIRMED")).toBe(false);
    expect(showsCancelledBookings("all")).toBe(true);
    expect(showsCancelledBookings("CANCELLED")).toBe(true);
  });
});

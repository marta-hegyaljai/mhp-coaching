import {describe, expect, it} from "vitest";

import {
  adminEnrolmentListHref,
  adminEnrolmentListHrefForPage,
  paginateAdminEnrolments,
  parseAdminEnrolmentQuery,
} from "./admin-enrolment-query";

describe("parseAdminEnrolmentQuery", () => {
  it("hides cancelled enrolments on the default list", () => {
    expect(parseAdminEnrolmentQuery({})).toEqual({
      q: "",
      showCancelled: false,
      page: 1,
    });
  });

  it("turns cancelled rows on from the shareable checkbox", () => {
    expect(
      parseAdminEnrolmentQuery({cancelled: "1", q: " marie ", page: "3"}),
    ).toEqual({
      q: "marie",
      showCancelled: true,
      page: 3,
    });
  });

  it("ignores a junk page and anything but cancelled=1", () => {
    expect(parseAdminEnrolmentQuery({cancelled: "yes", page: "0"})).toEqual({
      q: "",
      showCancelled: false,
      page: 1,
    });
  });
});

describe("adminEnrolmentListHref", () => {
  it("keeps the default URL clean", () => {
    expect(adminEnrolmentListHref()).toEqual({
      pathname: "/admin/courses/enrolments",
      query: {q: undefined, cancelled: undefined, page: undefined},
    });
  });

  it("carries the cancelled flag onto later pages", () => {
    expect(
      adminEnrolmentListHrefForPage(
        {q: "ada", showCancelled: true, page: 1},
        2,
      ),
    ).toEqual({
      pathname: "/admin/courses/enrolments",
      query: {q: "ada", cancelled: "1", page: "2"},
    });
  });
});

describe("paginateAdminEnrolments", () => {
  const rows = Array.from({length: 45}, (_, index) => index + 1);

  it("serves newest-first pages of twenty and clamps a stale deep link", () => {
    expect(paginateAdminEnrolments(rows, 1)).toMatchObject({
      items: rows.slice(0, 20),
      total: 45,
      page: 1,
      pageCount: 3,
    });
    expect(paginateAdminEnrolments(rows, 3).items).toEqual(rows.slice(40));
    expect(paginateAdminEnrolments(rows, 99).page).toBe(3);
  });

  it("still reports one page when the list is empty", () => {
    expect(paginateAdminEnrolments([], 1)).toEqual({
      items: [],
      total: 0,
      page: 1,
      pageCount: 1,
      pageSize: 20,
    });
  });
});

import {describe, expect, it} from "vitest";

import {
  parseUserListQuery,
  userListHref,
  userListHrefForPage,
} from "./user-list-query";
import {localizedPathname} from "@/i18n/path";

describe("parseUserListQuery", () => {
  it("uses safe defaults for missing or invalid values", () => {
    expect(parseUserListQuery({})).toEqual({
      q: "",
      status: "all",
      access: "all",
      page: 1,
    });
    expect(parseUserListQuery({status: "nope", access: ["secret"], page: "0"})).toEqual({
      q: "",
      status: "all",
      access: "all",
      page: 1,
    });
  });

  it("trims search, keeps the first array value, and accepts known filters", () => {
    expect(
      parseUserListQuery({
        q: ["  Ada@MHP.ch  ", "ignored"],
        status: "disabled",
        access: "rooms",
        page: "3",
      }),
    ).toEqual({
      q: "Ada@MHP.ch",
      status: "disabled",
      access: "rooms",
      page: 3,
    });
  });
});

describe("userListHref", () => {
  it("omits default query keys so the directory URL stays clean", () => {
    expect(userListHref({q: "", status: "all", access: "all", page: 1})).toBe(
      "/admin/users",
    );
    expect(
      userListHref({q: "ada", status: "active", access: "admin", page: 2}),
    ).toEqual({
      pathname: "/admin/users",
      query: {q: "ada", status: "active", access: "admin", page: "2"},
    });
    expect(localizedPathname("fr", userListHrefForPage({
      q: "ada",
      status: "all",
      access: "all",
      page: 1,
    }, 4))).toBe("/fr/admin/users?q=ada&page=4");
  });
});

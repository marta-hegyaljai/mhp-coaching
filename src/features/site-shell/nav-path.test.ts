import {describe, expect, it} from "vitest";

import {isCurrentPath} from "./nav-path";

describe("isCurrentPath", () => {
  it("marks the section that owns nested routes", () => {
    expect(isCurrentPath("/courses", "/courses")).toBe(true);
    expect(isCurrentPath("/courses/omni-hypnosis-practitioner", "/courses")).toBe(true);
    expect(isCurrentPath("/admin/users/42", "/admin")).toBe(true);
  });

  it("does not let a prefix claim an unrelated route", () => {
    expect(isCurrentPath("/courses-archive", "/courses")).toBe(false);
    expect(isCurrentPath("/contact", "/courses")).toBe(false);
    expect(isCurrentPath("/account/courses", "/courses")).toBe(false);
  });

  it("keeps the home entry exact", () => {
    expect(isCurrentPath("/", "/")).toBe(true);
    expect(isCurrentPath("/courses", "/")).toBe(false);
  });

  it("honours exact entries that are parents of other routes", () => {
    expect(isCurrentPath("/account", "/account", true)).toBe(true);
    expect(isCurrentPath("/account/courses", "/account", true)).toBe(false);
    expect(isCurrentPath("/account/courses", "/account/courses")).toBe(true);
  });
});

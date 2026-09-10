import {describe, expect, it} from "vitest";

import {isUniqueViolation} from "./unique-email";

describe("isUniqueViolation", () => {
  it("recognizes Postgres unique violations, including wrapped causes", () => {
    expect(isUniqueViolation({code: "23505", constraint: "users_email_normalized_unique"})).toBe(
      true,
    );
    expect(
      isUniqueViolation(
        {cause: {code: "23505", constraint: "users_email_normalized_unique"}},
        "users_email_normalized_unique",
      ),
    ).toBe(true);
    expect(isUniqueViolation({code: "23503"})).toBe(false);
    expect(
      isUniqueViolation({code: "23505", constraint: "other_unique"}, "users_email_normalized_unique"),
    ).toBe(false);
  });
});

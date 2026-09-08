import {describe, expect, it} from "vitest";

import {isValidFakeCheckoutToken, signFakeCheckoutToken} from "./index";

describe("fake checkout token", () => {
  it("accepts only the matching booking token", () => {
    const token = signFakeCheckoutToken("booking-1");

    expect(isValidFakeCheckoutToken("booking-1", token)).toBe(true);
    expect(isValidFakeCheckoutToken("booking-2", token)).toBe(false);
  });
});

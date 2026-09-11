import {describe, expect, it} from "vitest";

import {slotMetaClass, slotMetaText} from "./slot-styles";

describe("availability slot styles", () => {
  it("lets secondary text inherit the inverted foreground in actionable slots", () => {
    expect(slotMetaClass("available", true)).toBe("text-current opacity-70");
    expect(slotMetaClass("my-booking", true)).toBe("text-current opacity-70");
    expect(slotMetaClass("available", false)).toBe(slotMetaText.available);
  });
});

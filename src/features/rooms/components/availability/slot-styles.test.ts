import {describe, expect, it} from "vitest";

import {slotMetaText} from "./slot-styles";

describe("availability slot styles", () => {
  it("keeps secondary text legible when actionable slots invert on hover", () => {
    expect(slotMetaText.available).toContain("group-hover:text-parchment");
    expect(slotMetaText["my-booking"]).toContain("group-hover:text-ink");
  });
});

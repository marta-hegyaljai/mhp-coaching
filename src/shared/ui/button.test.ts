import {describe, expect, it} from "vitest";

import {type ButtonVariant, buttonStyles} from "@/shared/ui/button";

const bordered: ButtonVariant[] = ["primary", "secondary", "invert"];

describe("buttonStyles", () => {
  // Utilities of equal specificity resolve by stylesheet order, so a base
  // `border-transparent` silently erased every variant border colour.
  it("never lets the base override a variant border colour", () => {
    for (const variant of bordered) {
      expect(buttonStyles({variant})).not.toContain("border-transparent");
    }
  });

  it("gives every variant exactly one resting border colour", () => {
    const variants: ButtonVariant[] = [...bordered, "quiet"];
    for (const variant of variants) {
      const resting = buttonStyles({variant})
        .split(" ")
        .filter((token) => /^border-(?!\d)/.test(token));
      expect(resting, variant).toHaveLength(1);
    }
  });

  it("keeps secondary actions from blending into a white surface", () => {
    const secondary = buttonStyles({variant: "secondary"});
    expect(secondary).toContain("border-ink");
    expect(secondary).toContain("bg-shell");
  });

  it("clears the 44px tap target at every size", () => {
    expect(buttonStyles({size: "md"})).toContain("min-h-11");
    expect(buttonStyles({size: "lg"})).toContain("min-h-13");
  });
});

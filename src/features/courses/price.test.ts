import {describe, expect, it} from "vitest";

import {formatCataloguePrice} from "./price";

describe("formatCataloguePrice", () => {
  it("uses the localized free label at zero francs", () => {
    expect(formatCataloguePrice(0, "fr")).toBe("Gratuit");
    expect(formatCataloguePrice(0, "de")).toBe("Kostenlos");
    expect(formatCataloguePrice(0, "en")).toBe("Free");
  });

  it("keeps compact CHF figures for priced courses", () => {
    expect(formatCataloguePrice(890, "fr")).toContain("890");
    expect(formatCataloguePrice(890, "fr")).toContain("CHF");
  });
});

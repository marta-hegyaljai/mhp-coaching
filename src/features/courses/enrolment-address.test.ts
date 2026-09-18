import {describe, expect, it} from "vitest";

import {formatEnrolmentAddress} from "./enrolment-address";

describe("formatEnrolmentAddress", () => {
  it("joins street, locality and country on one line for a compact copy", () => {
    expect(
      formatEnrolmentAddress({
        street: "Chemin de la Fenetta 42",
        postalCode: "1752",
        city: "Villars-sur-Glâne",
        country: "CH",
      }),
    ).toBe("Chemin de la Fenetta 42, 1752 Villars-sur-Glâne, CH");
  });

  it("drops blank parts instead of leaving empty commas", () => {
    expect(
      formatEnrolmentAddress({
        street: "Rue du Midi 1",
        postalCode: "",
        city: "Fribourg",
        country: "",
      }),
    ).toBe("Rue du Midi 1, Fribourg");
  });
});

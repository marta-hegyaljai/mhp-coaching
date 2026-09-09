import {describe, expect, it} from "vitest";

import {organization} from "./info";

describe("organization contact details", () => {
  it("uses the MHP Coaching email and mobile number", () => {
    expect(organization.email).toBe("contact@mhp-coaching.ch");
    expect(organization.emailHref).toBe("mailto:contact@mhp-coaching.ch");
    expect(organization.phone).toBe("+41 79 451 44 92");
    expect(organization.phoneHref).toBe("tel:+41794514492");
  });

  it("publishes MHP Coaching as the legal entity", () => {
    expect(organization.legalName).toBe("MHP Coaching");
    expect(organization.founder).toBe("Marta Hegyaljai Python");
    expect(organization.addresses.headquarters.street).toBe(
      "Chemin de la Fenetta 42",
    );
    expect(organization.addresses.headquarters.city).toBe("Villars-sur-Glâne");
  });
});

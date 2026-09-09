import {describe, expect, it} from "vitest";

import {legalDocuments, legalSlugs} from "./content";
import {organization} from "@/features/organization/info";

describe("legal documents", () => {
  it("covers imprint, privacy, booking terms, site terms and copyright in every locale", () => {
    expect(legalDocuments.map((document) => document.slug)).toEqual([
      ...legalSlugs,
    ]);

    for (const document of legalDocuments) {
      for (const locale of ["fr", "de", "en"] as const) {
        expect(document.sections[locale].length).toBeGreaterThan(2);
      }
    }
  });

  it("never mentions the retired brand name or a previous company", () => {
    expect(JSON.stringify(legalDocuments)).not.toMatch(
      /mhp-hypnose|Partners Sàrl|CHE-459|Gilles/i,
    );
  });

  it("puts TWINT identity fields in the imprint", () => {
    const imprint = legalDocuments.find((document) => document.slug === "imprint");
    expect(imprint).toBeDefined();
    const french = JSON.stringify(imprint!.sections.fr);

    expect(french).toContain(organization.legalName);
    expect(french).toContain(organization.addresses.headquarters.street);
    expect(french).toContain(organization.addresses.headquarters.postalCode);
    expect(french).toContain(organization.addresses.headquarters.city);
    expect(french).toContain(organization.email);
    expect(french).toContain(organization.phone);
    expect(french).toContain(organization.founder);
  });

  it("states TWINT, cards, CHF and Stripe in the booking terms", () => {
    const terms = legalDocuments.find((document) => document.slug === "terms");
    const blob = JSON.stringify(terms);

    expect(blob).toMatch(/TWINT/);
    expect(blob).toMatch(/Visa/);
    expect(blob).toMatch(/Mastercard/);
    expect(blob).toMatch(/CHF/);
    expect(blob).toMatch(/Stripe/);
  });
});

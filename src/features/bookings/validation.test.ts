import {describe, expect, it} from "vitest";

import {parseBookingForm} from "./validation";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

describe("parseBookingForm", () => {
  it("accepts a complete booking payload", () => {
    const result = parseBookingForm(
      form({
        firstName: "Marta",
        lastName: "Hegyaljai",
        dateOfBirth: "1975-12-10",
        email: "marta@example.com",
        phone: "+41 79 123 45 67",
        street: "Chemin de la Fenetta 42",
        postalCode: "1752",
        city: "Villars-sur-Glâne",
        country: "Suisse",
        courseDateId: "omni-practitioner-fribourg-future",
        privacyAccepted: "on",
      }),
    );

    expect(result.values?.email).toBe("marta@example.com");
    expect(result.values?.dateOfBirth).toBe("1975-12-10");
    expect(result.values?.street).toBe("Chemin de la Fenetta 42");
    expect(result.values?.intent).toBe("checkout");
    expect(result.errors).toBeUndefined();
  });

  it("rejects missing privacy acceptance and invalid email", () => {
    const result = parseBookingForm(
      form({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "not-an-email",
        phone: "0213112581",
        courseDateId: "date-1",
      }),
    );

    expect(result.values).toBeUndefined();
    expect(result.errors?.email).toBeTruthy();
    expect(result.errors?.privacyAccepted).toBeTruthy();
  });

  it("rejects a missing or future date of birth", () => {
    const missing = parseBookingForm(
      form({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        phone: "0213112581",
        street: "Chemin de la Fenetta 42",
        postalCode: "1752",
        city: "Villars-sur-Glâne",
        country: "Suisse",
        courseDateId: "date-1",
        privacyAccepted: "on",
      }),
    );

    expect(missing.values).toBeUndefined();
    expect(missing.errors?.dateOfBirth).toBeTruthy();

    const future = parseBookingForm(
      form({
        firstName: "Ada",
        lastName: "Lovelace",
        dateOfBirth: "2099-01-01",
        email: "ada@example.com",
        phone: "0213112581",
        street: "Chemin de la Fenetta 42",
        postalCode: "1752",
        city: "Villars-sur-Glâne",
        country: "Suisse",
        courseDateId: "date-1",
        privacyAccepted: "on",
      }),
    );

    expect(future.values).toBeUndefined();
    expect(future.errors?.dateOfBirth).toBeTruthy();
  });
});

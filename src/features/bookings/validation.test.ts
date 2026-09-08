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
        email: "marta@example.com",
        phone: "+41 21 311 25 81",
        courseDateId: "omni-practitioner-lausanne-2026-10",
        privacyAccepted: "on",
      }),
    );

    expect(result.values?.email).toBe("marta@example.com");
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
});

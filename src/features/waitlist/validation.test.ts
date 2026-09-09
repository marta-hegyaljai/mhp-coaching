import {describe, expect, it} from "vitest";

import {parseWaitlistForm} from "./validation";

describe("parseWaitlistForm", () => {
  it("accepts a complete waitlist request", () => {
    const result = parseWaitlistForm(
      form({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        phone: "+41 79 451 44 92",
        privacyAccepted: "on",
      }),
    );

    expect(result.values?.email).toBe("ada@example.com");
    expect(result.errors).toBeUndefined();
  });

  it("rejects missing privacy acceptance", () => {
    const result = parseWaitlistForm(
      form({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        phone: "+41 79 000 00 00",
      }),
    );

    expect(result.errors?.privacyAccepted).toBeTruthy();
  });

  it("treats a filled honeypot as spam", () => {
    const result = parseWaitlistForm(
      form({
        firstName: "Bot",
        lastName: "Net",
        email: "bot@example.com",
        phone: "+41 79 000 00 00",
        privacyAccepted: "on",
        company: "spam",
      }),
    );

    expect(result.spam).toBe(true);
  });
});

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

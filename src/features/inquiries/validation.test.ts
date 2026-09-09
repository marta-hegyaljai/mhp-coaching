import {describe, expect, it} from "vitest";

import {parseInquiryForm} from "./validation";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

describe("parseInquiryForm", () => {
  it("accepts a complete contact message", () => {
    const result = parseInquiryForm(
      form({
        name: "Ada Lovelace",
        email: "ada@example.com",
        phone: "+41 79 000 00 00",
        message: "Je souhaite payer par virement.",
      }),
    );

    expect(result.values?.email).toBe("ada@example.com");
    expect(result.errors).toBeUndefined();
  });

  it("quietly drops honeypot spam", () => {
    const result = parseInquiryForm(
      form({
        name: "Bot",
        email: "bot@example.com",
        message: "Buy this now please",
        company: "Spam Ltd",
      }),
    );

    expect(result.spam).toBe(true);
    expect(result.values).toBeUndefined();
  });
});

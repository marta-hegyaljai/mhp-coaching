import {describe, expect, it} from "vitest";

import {parseCallForm, parseInquiryForm} from "./validation";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

const contact = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "+41 79 000 00 00",
  privacyAccepted: "on",
};

describe("course advice forms", () => {
  it("accepts a complete call reservation", () => {
    const parsed = parseCallForm(
      form({
        ...contact,
        date: "2026-09-21",
        time: "09:15",
        message: "",
      }),
    );

    expect(parsed.values).toMatchObject({
      firstName: "Ada",
      time: "09:15",
      date: "2026-09-21",
    });
  });

  it("rejects a time that is not on the 15-minute grid", () => {
    const parsed = parseCallForm(
      form({
        ...contact,
        date: "2026-09-21",
        time: "09:10",
      }),
    );

    expect(parsed.errors?.time).toBeTruthy();
  });

  it("treats a filled honeypot as spam", () => {
    const parsed = parseCallForm(
      form({
        ...contact,
        date: "2026-09-21",
        time: "09:15",
        company: "bot",
      }),
    );

    expect(parsed.spam).toBe(true);
  });

  it("requires a written question of at least ten characters", () => {
    const parsed = parseInquiryForm(
      form({
        ...contact,
        message: "Too short",
      }),
    );

    expect(parsed.errors?.message).toBeTruthy();
  });

  it("accepts a complete written question", () => {
    const parsed = parseInquiryForm(
      form({
        ...contact,
        message: "I would like to know if this course suits a physician.",
      }),
    );

    expect(parsed.values?.email).toBe("ada@example.com");
  });
});

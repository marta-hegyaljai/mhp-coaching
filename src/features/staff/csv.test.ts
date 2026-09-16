import {describe, expect, it} from "vitest";

import type {WaitlistEntry} from "@/db/schema";

import {bookingsToCsv, waitlistToCsv} from "./csv";

describe("bookingsToCsv", () => {
  it("includes date of birth in the export header", () => {
    expect(bookingsToCsv([])).toContain("firstName,lastName,dateOfBirth,email");
  });
});

describe("waitlistToCsv", () => {
  it("exports waitlist contacts with course identity", () => {
    const createdAt = new Date("2026-09-09T08:00:00.000Z");
    const rows: WaitlistEntry[] = [
      {
        id: "w1",
        createdAt,
        courseId: "medical-hypnosis-m1",
        courseTitle: "Hypnose médicale — techniques de base",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        phone: "+41 79 451 44 92",
        locale: "fr",
        privacyAcceptedAt: createdAt,
        courseSessionId: null,
        notifiedAt: null,
      },
    ];

    const csv = waitlistToCsv(rows);

    expect(csv.startsWith("id,createdAt,courseId,courseTitle,courseSessionId,")).toBe(true);
    expect(csv).toContain("notifiedAt");
    expect(csv).toContain("Ada");
    expect(csv).toContain("ada@example.com");
    expect(csv).toContain("medical-hypnosis-m1");
    expect(csv).toContain("+41 79 451 44 92");
  });
});

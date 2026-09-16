import {describe, expect, it} from "vitest";

import type {SessionDraftStorage} from "@/shared/session-draft";

import {
  BOOKING_FORM_DRAFT_MAX_AGE_MS,
  bookingSessionDraftFromFormData,
  clearAllBookingFormDrafts,
  isBookingSessionDraft,
  pickFilled,
  readBookingFormDraft,
  readLastBookingContact,
  writeBookingFormDraft,
  writeLastBookingContact,
} from "./form-draft";

function memoryStorage(): SessionDraftStorage {
  const data = new Map<string, string>();

  return {
    get length() {
      return data.size;
    },
    getItem(key) {
      return data.has(key) ? data.get(key)! : null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
    key(index) {
      return [...data.keys()][index] ?? null;
    },
  };
}

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

const completeDraft = {
  firstName: "Ada",
  lastName: "Lovelace",
  dateOfBirth: "1990-05-15",
  email: "ada@example.com",
  phone: "+41 79 123 45 67",
  street: "Chemin de la Fenetta 42",
  postalCode: "1752",
  city: "Villars-sur-Glâne",
  country: "Suisse",
  courseDateId: "omni-practitioner-2026-10-08",
  privacyAccepted: true,
};

describe("booking form drafts", () => {
  it("reads a booking payload from form data", () => {
    expect(
      bookingSessionDraftFromFormData(
        form({
          firstName: "Ada",
          lastName: "Lovelace",
          dateOfBirth: "1990-05-15",
          email: "ada@example.com",
          phone: "+41 79 123 45 67",
          street: "Chemin de la Fenetta 42",
          postalCode: "1752",
          city: "Villars-sur-Glâne",
          country: "Suisse",
          courseDateId: "omni-practitioner-2026-10-08",
          privacyAccepted: "on",
        }),
      ),
    ).toEqual(completeDraft);
  });

  it("rejects an incomplete stored object", () => {
    expect(isBookingSessionDraft({firstName: "Ada"})).toBe(false);
    expect(isBookingSessionDraft(completeDraft)).toBe(true);
  });

  it("restores a stored draft for the same course and ignores other courses", () => {
    const storage = memoryStorage();
    writeBookingFormDraft("omni", completeDraft, {storage});
    writeBookingFormDraft("cafe", {...completeDraft, firstName: "Léa"}, {storage});

    expect(readBookingFormDraft("omni", {storage})?.firstName).toBe("Ada");
    expect(readBookingFormDraft("cafe", {storage})?.firstName).toBe("Léa");

    clearAllBookingFormDrafts(storage);
    expect(readBookingFormDraft("omni", {storage})).toBeNull();
    expect(readBookingFormDraft("cafe", {storage})).toBeNull();
  });

  it("keeps last successful contact after course drafts are cleared", () => {
    const storage = memoryStorage();
    writeBookingFormDraft("cafe", completeDraft, {storage});
    clearAllBookingFormDrafts(storage);

    expect(readBookingFormDraft("cafe", {storage})).toBeNull();
    expect(readLastBookingContact({storage})).toMatchObject({
      firstName: "Ada",
      lastName: "Lovelace",
      dateOfBirth: "1990-05-15",
      email: "ada@example.com",
      street: "Chemin de la Fenetta 42",
    });
  });

  it("does not let an empty later form wipe a stored date of birth", () => {
    const storage = memoryStorage();
    writeLastBookingContact(
      {firstName: "Ada", dateOfBirth: "1990-05-15", email: "ada@example.com"},
      {storage},
    );
    writeLastBookingContact({firstName: "Ada", lastName: "Lovelace", dateOfBirth: ""}, {storage});

    expect(readLastBookingContact({storage})).toMatchObject({
      firstName: "Ada",
      lastName: "Lovelace",
      dateOfBirth: "1990-05-15",
      email: "ada@example.com",
    });
  });

  it("prefers a filled value and skips blanks", () => {
    expect(pickFilled("", "  ", "Ada", "Léa")).toBe("Ada");
    expect(pickFilled(undefined, "")).toBeUndefined();
  });

  it("expires a draft after twenty-four hours", () => {
    const storage = memoryStorage();
    const savedAt = 1_000;
    writeBookingFormDraft("omni", completeDraft, {
      storage,
      now: () => savedAt,
    });

    expect(
      readBookingFormDraft("omni", {
        storage,
        now: () => savedAt + BOOKING_FORM_DRAFT_MAX_AGE_MS + 1,
      }),
    ).toBeNull();
  });
});

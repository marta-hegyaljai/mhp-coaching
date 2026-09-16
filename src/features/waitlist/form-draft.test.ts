import {describe, expect, it} from "vitest";

import type {SessionDraftStorage} from "@/shared/session-draft";

import {
  clearWaitlistFormDraft,
  readWaitlistFormDraft,
  waitlistSessionDraftFromFormData,
  writeWaitlistFormDraft,
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

describe("waitlist form drafts", () => {
  it("stores and restores a waitlist payload for one course", () => {
    const storage = memoryStorage();
    const formData = new FormData();
    formData.set("firstName", "Ada");
    formData.set("lastName", "Lovelace");
    formData.set("email", "ada@example.com");
    formData.set("phone", "+41 79 123 45 67");
    formData.set("privacyAccepted", "on");

    const draft = waitlistSessionDraftFromFormData(formData);
    writeWaitlistFormDraft("omni", draft, {storage});

    expect(readWaitlistFormDraft("omni", {storage})).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "+41 79 123 45 67",
      privacyAccepted: true,
    });
    expect(readWaitlistFormDraft("cafe", {storage})).toBeNull();

    clearWaitlistFormDraft("omni", storage);
    expect(readWaitlistFormDraft("omni", {storage})).toBeNull();
  });
});

import {describe, expect, it} from "vitest";

import {
  clearSessionDraft,
  clearSessionDraftsByPrefix,
  readSessionDraft,
  sessionDraftStorageKey,
  writeSessionDraft,
  type SessionDraftStorage,
} from "./session-draft";

function memoryStorage(initial: Record<string, string> = {}): SessionDraftStorage {
  const data = new Map(Object.entries(initial));

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

function isName(value: unknown): value is {name: string} {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as {name?: unknown}).name === "string",
  );
}

describe("session drafts", () => {
  it("round-trips a value until it expires", () => {
    const storage = memoryStorage();
    let now = 1_000;

    writeSessionDraft("booking:omni", {name: "Ada"}, {storage, now: () => now});

    expect(
      readSessionDraft("booking:omni", isName, {
        maxAgeMs: 1_000,
        storage,
        now: () => now,
      }),
    ).toEqual({name: "Ada"});

    now = 2_500;
    expect(
      readSessionDraft("booking:omni", isName, {
        maxAgeMs: 1_000,
        storage,
        now: () => now,
      }),
    ).toBeNull();
    expect(storage.getItem(sessionDraftStorageKey("booking:omni"))).toBeNull();
  });

  it("drops malformed payloads instead of throwing", () => {
    const storage = memoryStorage({
      [sessionDraftStorageKey("booking:omni")]: "{not-json",
    });

    expect(
      readSessionDraft("booking:omni", isName, {maxAgeMs: 1_000, storage}),
    ).toBeNull();
    expect(storage.getItem(sessionDraftStorageKey("booking:omni"))).toBeNull();
  });

  it("clears one draft or every draft in a scope prefix", () => {
    const storage = memoryStorage();
    writeSessionDraft("booking:omni", {name: "Ada"}, {storage});
    writeSessionDraft("booking:cafe", {name: "Léa"}, {storage});
    writeSessionDraft("waitlist:omni", {name: "Eve"}, {storage});

    clearSessionDraft("booking:omni", storage);
    expect(
      readSessionDraft("booking:omni", isName, {maxAgeMs: 60_000, storage}),
    ).toBeNull();
    expect(
      readSessionDraft("booking:cafe", isName, {maxAgeMs: 60_000, storage}),
    ).toEqual({name: "Léa"});

    clearSessionDraftsByPrefix("booking:", storage);
    expect(
      readSessionDraft("booking:cafe", isName, {maxAgeMs: 60_000, storage}),
    ).toBeNull();
    expect(
      readSessionDraft("waitlist:omni", isName, {maxAgeMs: 60_000, storage}),
    ).toEqual({name: "Eve"});
  });

  it("no-ops when storage is unavailable", () => {
    expect(
      readSessionDraft("booking:omni", isName, {maxAgeMs: 1_000, storage: null}),
    ).toBeNull();
    expect(() =>
      writeSessionDraft("booking:omni", {name: "Ada"}, {storage: null}),
    ).not.toThrow();
  });
});

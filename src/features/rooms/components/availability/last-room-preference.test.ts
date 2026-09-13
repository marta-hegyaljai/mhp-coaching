import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {
  pickPreferredRoomId,
  readLastRoomPreference,
  writeLastRoomPreference,
} from "./last-room-preference";

describe("last room preference", () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem(key: string) {
        return store[key] ?? null;
      },
      setItem(key: string, value: string) {
        store[key] = value;
      },
      removeItem(key: string) {
        delete store[key];
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("remembers and restores the last chosen room", () => {
    writeLastRoomPreference("room-b");
    expect(readLastRoomPreference()).toBe("room-b");
    expect(pickPreferredRoomId(["room-a", "room-b"])).toBe("room-b");
  });

  it("keeps the current room while it stays available", () => {
    writeLastRoomPreference("room-a");
    expect(pickPreferredRoomId(["room-a", "room-b"], "room-b")).toBe("room-b");
  });

  it("uses the saved room when no current choice is set", () => {
    writeLastRoomPreference("room-b");
    expect(pickPreferredRoomId(["room-a", "room-b"], "")).toBe("room-b");
    expect(pickPreferredRoomId(["room-a", "room-b"])).toBe("room-b");
  });

  it("falls back when the saved room is not free", () => {
    writeLastRoomPreference("room-c");
    expect(pickPreferredRoomId(["room-a", "room-b"])).toBe("room-a");
  });
});

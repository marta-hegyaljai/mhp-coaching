import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {
  ADMIN_BOOKINGS_LAYOUT_KEY,
  OWN_BOOKINGS_LAYOUT_KEY,
  readBookingsLayout,
  writeBookingsLayout,
} from "./layout";

describe("bookings layout preference", () => {
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

  it("defaults to the table and remembers cards per surface", () => {
    expect(readBookingsLayout(OWN_BOOKINGS_LAYOUT_KEY)).toBe("table");
    writeBookingsLayout(OWN_BOOKINGS_LAYOUT_KEY, "cards");
    expect(readBookingsLayout(OWN_BOOKINGS_LAYOUT_KEY)).toBe("cards");
    expect(readBookingsLayout(ADMIN_BOOKINGS_LAYOUT_KEY)).toBe("table");
  });
});

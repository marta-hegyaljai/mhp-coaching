import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {
  readAdminBookingsLayout,
  writeAdminBookingsLayout,
} from "./layout-preference";

describe("admin bookings layout preference", () => {
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

  it("defaults to the table on the web", () => {
    expect(readAdminBookingsLayout()).toBe("table");
  });

  it("remembers cards after the admin chooses them", () => {
    writeAdminBookingsLayout("cards");
    expect(readAdminBookingsLayout()).toBe("cards");
    writeAdminBookingsLayout("table");
    expect(readAdminBookingsLayout()).toBe("table");
  });
});

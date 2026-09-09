import {describe, expect, it} from "vitest";

import {getDatabaseUrl} from "./database-url";

describe("getDatabaseUrl", () => {
  it("prefers the portable DATABASE_URL", () => {
    expect(
      getDatabaseUrl({
        DATABASE_URL: "postgresql://mhp:mhp@localhost:5432/mhp",
        NEON_DATABASE_URL: "postgresql://neon.example/neondb",
      }),
    ).toBe("postgresql://mhp:mhp@localhost:5432/mhp");
  });

  it("uses the Neon Vercel alias when DATABASE_URL is missing", () => {
    expect(
      getDatabaseUrl({
        NEON_DATABASE_URL: "postgresql://neon.example/neondb",
      }),
    ).toBe("postgresql://neon.example/neondb");
  });

  it("ignores blank DATABASE_URL values", () => {
    expect(
      getDatabaseUrl({
        DATABASE_URL: "  ",
        NEON_POSTGRES_URL: "postgresql://neon.example/pooled",
      }),
    ).toBe("postgresql://neon.example/pooled");
  });

  it("returns undefined when no connection string is configured", () => {
    expect(getDatabaseUrl({})).toBeUndefined();
  });
});

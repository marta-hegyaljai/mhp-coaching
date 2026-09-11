import {describe, expect, it} from "vitest";

import {getDatabaseUrl, getMigrationDatabaseUrl} from "./database-url";

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

  it("makes Neon SSL certificate verification explicit", () => {
    expect(
      getDatabaseUrl({
        NEON_DATABASE_URL:
          "postgresql://neon.example/neondb?sslmode=require&channel_binding=require",
      }),
    ).toBe(
      "postgresql://neon.example/neondb?sslmode=verify-full&channel_binding=require",
    );
  });

  it("does not change local URLs or an already explicit SSL mode", () => {
    expect(
      getDatabaseUrl({DATABASE_URL: "postgresql://mhp:mhp@localhost:5432/mhp"}),
    ).toBe("postgresql://mhp:mhp@localhost:5432/mhp");
    expect(
      getDatabaseUrl({
        DATABASE_URL: "postgresql://neon.example/neondb?sslmode=verify-full",
      }),
    ).toBe("postgresql://neon.example/neondb?sslmode=verify-full");
  });
});

describe("getMigrationDatabaseUrl", () => {
  it("prefers the unpooled Neon marketplace alias", () => {
    expect(
      getMigrationDatabaseUrl({
        NEON_DATABASE_URL: "postgresql://neon.example/pooled",
        NEON_DATABASE_URL_UNPOOLED: "postgresql://neon.example/direct",
      }),
    ).toBe("postgresql://neon.example/direct");
  });

  it("makes migration URL SSL certificate verification explicit", () => {
    expect(
      getMigrationDatabaseUrl({
        NEON_DATABASE_URL_UNPOOLED:
          "postgresql://neon.example/direct?sslmode=verify-ca",
      }),
    ).toBe("postgresql://neon.example/direct?sslmode=verify-full");
  });

  it("accepts the Vercel Postgres non-pooling alias", () => {
    expect(
      getMigrationDatabaseUrl({
        POSTGRES_URL: "postgresql://neon.example/pooled",
        POSTGRES_URL_NON_POOLING: "postgresql://neon.example/direct",
      }),
    ).toBe("postgresql://neon.example/direct");
  });

  it("falls back to the runtime connection", () => {
    expect(
      getMigrationDatabaseUrl({
        DATABASE_URL: "postgresql://mhp:mhp@localhost:5432/mhp",
      }),
    ).toBe("postgresql://mhp:mhp@localhost:5432/mhp");
  });
});

import {describe, expect, it} from "vitest";

import {
  shouldApplyHostedMigrations,
  shouldSeedHostedCatalogue,
} from "./hosted-migrations";

describe("shouldApplyHostedMigrations", () => {
  it("runs on Vercel production and preview builds", () => {
    expect(shouldApplyHostedMigrations({VERCEL_ENV: "production"})).toBe(true);
    expect(shouldApplyHostedMigrations({VERCEL_ENV: "preview"})).toBe(true);
    expect(shouldApplyHostedMigrations({VERCEL_ENV: "development"})).toBe(false);
    expect(shouldApplyHostedMigrations({})).toBe(false);
  });
});

describe("shouldSeedHostedCatalogue", () => {
  it("re-seeds the catalogue only on Vercel production builds", () => {
    expect(shouldSeedHostedCatalogue({VERCEL_ENV: "production"})).toBe(true);
    expect(shouldSeedHostedCatalogue({VERCEL_ENV: "preview"})).toBe(false);
    expect(shouldSeedHostedCatalogue({})).toBe(false);
  });
});

import {describe, expect, it} from "vitest";

import {shouldApplyHostedMigrations} from "./hosted-migrations";

describe("shouldApplyHostedMigrations", () => {
  it("runs only on Vercel production builds", () => {
    expect(shouldApplyHostedMigrations({VERCEL_ENV: "production"})).toBe(true);
    expect(shouldApplyHostedMigrations({VERCEL_ENV: "preview"})).toBe(false);
    expect(shouldApplyHostedMigrations({VERCEL_ENV: "development"})).toBe(false);
    expect(shouldApplyHostedMigrations({})).toBe(false);
  });
});

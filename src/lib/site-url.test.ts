import {describe, expect, it} from "vitest";

import {getSiteUrl} from "./site-url";

describe("getSiteUrl", () => {
  it("uses an explicitly configured absolute site URL", () => {
    expect(getSiteUrl({SITE_URL: "https://mhp.example/path"}).href).toBe(
      "https://mhp.example/path",
    );
  });

  it("ignores blank configuration and uses Vercel's production domain", () => {
    expect(
      getSiteUrl({
        SITE_URL: "  ",
        NEXT_PUBLIC_SITE_URL: "",
        VERCEL_PROJECT_PRODUCTION_URL: "mhp-coaching.vercel.app",
      }).href,
    ).toBe("https://mhp-coaching.vercel.app/");
  });

  it("supports Vercel preview domains without a URL scheme", () => {
    expect(getSiteUrl({VERCEL_URL: "preview-123.vercel.app"}).href).toBe(
      "https://preview-123.vercel.app/",
    );
  });

  it("falls back safely when configured values are invalid", () => {
    expect(
      getSiteUrl({
        SITE_URL: "://invalid",
        NEXT_PUBLIC_SITE_URL: "mailto:test@example.com",
      }).href,
    ).toBe("http://localhost:3000/");
  });

  it("prefers MARKETING_ORIGIN for the public canonical origin", () => {
    expect(
      getSiteUrl({
        MARKETING_ORIGIN: "https://mhp-coaching.ch",
        SITE_URL: "https://app.mhp-coaching.ch",
      }).origin,
    ).toBe("https://mhp-coaching.ch");
  });
});

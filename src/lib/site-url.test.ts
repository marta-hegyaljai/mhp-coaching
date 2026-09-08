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
        VERCEL_PROJECT_PRODUCTION_URL: "mhp-hypnose.vercel.app",
      }).href,
    ).toBe("https://mhp-hypnose.vercel.app/");
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
});

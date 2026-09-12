import {describe, expect, it} from "vitest";

import {
  classifyPath,
  dualOriginRedirect,
  getSplitOrigins,
} from "./origins";

const env = {
  SITE_URL: "https://mhp-coaching.ch",
  MARKETING_ORIGIN: "https://mhp-coaching.ch",
  APP_ORIGIN: "https://app.mhp-coaching.ch",
};

describe("dual-origin routing", () => {
  it("does not split when APP_ORIGIN is unset", () => {
    expect(getSplitOrigins({SITE_URL: "https://mhp-coaching.ch"})).toBeNull();
  });

  it("classifies authenticated and public paths", () => {
    expect(classifyPath("/fr/salles")).toBe("app");
    expect(classifyPath("/de/abrechnung/auszuege/abc")).toBe("app");
    expect(classifyPath("/en/admin/users")).toBe("app");
    expect(classifyPath("/fr/connexion")).toBe("app");
    expect(classifyPath("/fr/formations")).toBe("marketing");
    expect(classifyPath("/en")).toBe("marketing");
    expect(classifyPath("/de/kontakt")).toBe("marketing");
  });

  it("sends room and account paths from the marketing host to the app origin", () => {
    const redirect = dualOriginRedirect(
      new Request("https://mhp-coaching.ch/fr/salles?date=2026-09-21", {
        headers: {host: "mhp-coaching.ch"},
      }),
      env,
    );
    expect(redirect?.toString()).toBe(
      "https://app.mhp-coaching.ch/fr/salles?date=2026-09-21",
    );
  });

  it("sends public course paths from the app host to the marketing origin", () => {
    const redirect = dualOriginRedirect(
      new Request("https://app.mhp-coaching.ch/de/ausbildungen", {
        headers: {host: "app.mhp-coaching.ch"},
      }),
      env,
    );
    expect(redirect?.toString()).toBe("https://mhp-coaching.ch/de/ausbildungen");
  });

  it("treats www as the marketing host and leaves preview hosts alone", () => {
    const www = dualOriginRedirect(
      new Request("https://www.mhp-coaching.ch/en/rooms", {
        headers: {host: "www.mhp-coaching.ch"},
      }),
      env,
    );
    expect(www?.toString()).toBe("https://app.mhp-coaching.ch/en/rooms");
    expect(
      dualOriginRedirect(
        new Request("https://preview.vercel.app/en/rooms", {
          headers: {host: "preview.vercel.app"},
        }),
        env,
      ),
    ).toBeNull();
  });
});

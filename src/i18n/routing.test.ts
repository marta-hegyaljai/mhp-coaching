import {describe, expect, it} from "vitest";

import {routing} from "./routing";

describe("locale routing", () => {
  it("keeps French as the default and exposes every launch locale", () => {
    expect(routing.defaultLocale).toBe("fr");
    expect(routing.locales).toEqual(["fr", "de", "en"]);
  });
});

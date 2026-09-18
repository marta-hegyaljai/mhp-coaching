import {afterEach, describe, expect, it, vi} from "vitest";

import {copyTextToClipboard} from "./copy-text";

describe("copyTextToClipboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("writes the full value, not the truncated display", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {clipboard: {writeText}});

    await copyTextToClipboard("ada.guest@example.test");

    expect(writeText).toHaveBeenCalledWith("ada.guest@example.test");
  });
});

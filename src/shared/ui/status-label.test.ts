import {describe, expect, it} from "vitest";

import {statusRailClass, statusToneClass} from "./status-label";

describe("statusToneClass", () => {
  it("keeps public copy monochrome and colours operational states", () => {
    expect(statusToneClass.strong).toContain("text-ink");
    expect(statusToneClass.muted).toContain("text-ink-subtle");
    expect(statusToneClass.ok).toContain("status-ok");
    expect(statusToneClass.stop).toContain("status-stop");
    expect(statusToneClass.gold).toContain("gold-deep");
  });
});

describe("statusRailClass", () => {
  it("draws a 3px rail in the matching token, never a fill", () => {
    expect(statusRailClass("ok")).toContain("border-l-[3px]");
    expect(statusRailClass("ok")).toContain("status-ok");
    expect(statusRailClass("stop")).toContain("status-stop");
    expect(statusRailClass("gold")).toContain("gold-deep");
  });

  it("keeps a transparent rail so mixed rows stay aligned", () => {
    expect(statusRailClass("muted")).toContain("border-l-transparent");
    expect(statusRailClass(null)).toContain("border-l-transparent");
  });
});

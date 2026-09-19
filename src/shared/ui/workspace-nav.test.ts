import {describe, expect, it} from "vitest";

import {workspaceCurrentLabel, type WorkspaceNavModel} from "./workspace-nav";

const nav: WorkspaceNavModel = {
  eyebrow: "Administration",
  label: "Admin sections",
  current: "overview",
  items: [
    {key: "overview", href: "/admin/overview", label: "Overview"},
    {key: "users", href: "/admin/users", label: "Users"},
  ],
};

describe("workspaceCurrentLabel", () => {
  it("names the selected destination", () => {
    expect(workspaceCurrentLabel(nav)).toBe("Overview");
    expect(workspaceCurrentLabel({...nav, current: "users"})).toBe("Users");
  });

  it("falls back to the workspace name when the key is unknown", () => {
    expect(workspaceCurrentLabel({...nav, current: "missing"})).toBe("Administration");
  });
});

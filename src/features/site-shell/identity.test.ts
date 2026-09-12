import {describe, expect, it} from "vitest";

import {displayName, personInitials} from "./identity";

describe("displayName", () => {
  it("prefers the full name and falls back to the account email", () => {
    expect(displayName({firstName: "Ada", lastName: "Admin"})).toBe("Ada Admin");
    expect(displayName({firstName: " Ada ", lastName: ""})).toBe("Ada");
    expect(displayName({firstName: "", lastName: "", email: "ada@example.test"})).toBe(
      "ada@example.test",
    );
  });

  it("survives missing profile fields", () => {
    expect(displayName({})).toBe("");
    expect(displayName({firstName: null, lastName: null, email: null})).toBe("");
  });
});

describe("personInitials", () => {
  it("builds a monogram from the name", () => {
    expect(personInitials({firstName: "Ada", lastName: "Admin"})).toBe("AA");
    expect(personInitials({firstName: "ada", lastName: "admin"})).toBe("AA");
  });

  it("keeps accented and non-Latin names intact", () => {
    expect(personInitials({firstName: "Émile", lastName: "Zola"})).toBe("ÉZ");
    expect(personInitials({firstName: "Žofia", lastName: "Nováková"})).toBe("ŽN");
  });

  it("falls back through partial names, email and a neutral mark", () => {
    expect(personInitials({firstName: "Ada", lastName: "  "})).toBe("A");
    expect(personInitials({lastName: "Admin"})).toBe("A");
    expect(personInitials({email: "ada@example.test"})).toBe("A");
    expect(personInitials({})).toBe("•");
    expect(personInitials({firstName: "   ", email: "   "})).toBe("•");
  });
});

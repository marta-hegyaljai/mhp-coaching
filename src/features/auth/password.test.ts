import {describe, expect, it} from "vitest";

import {isValidEmail, normalizeEmail} from "./email";
import {hashPassword, passwordErrors, verifyPassword} from "./password";
import {
  canAccessRooms,
  canAccessStaffLists,
  canAdminister,
  canAuthenticate,
} from "./policy";
import {safeInternalPath} from "./redirect-path";
import {hashToken, randomToken, tokensMatch} from "./tokens";

describe("email normalization", () => {
  it("trims, lowercases and rejects invalid addresses", () => {
    expect(normalizeEmail("  Ada@Example.COM ")).toBe("ada@example.com");
    expect(isValidEmail("ada@example.com")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("password hashing", () => {
  it("rejects short passwords and email-as-password", () => {
    expect(passwordErrors("short", "short", "ada@example.com")).toContain("tooShort");
    expect(passwordErrors("aaaaaaaaaaaa", "bbbbbbbbbbbb", "ada@example.com")).toContain(
      "mismatch",
    );
    expect(
      passwordErrors("ada@example.com", "ada@example.com", "ada@example.com"),
    ).toContain("sameAsEmail");
  });

  it("verifies a scrypt hash and rejects a wrong password", async () => {
    const hash = await hashPassword("correct-horse-12");
    expect(hash.startsWith("scrypt$16384$8$1$")).toBe(true);
    expect(await verifyPassword("correct-horse-12", hash)).toBe(true);
    expect(await verifyPassword("wrong-password-12", hash)).toBe(false);
    expect(await verifyPassword("correct-horse-12", "not-a-hash")).toBe(false);
  });
});

describe("tokens", () => {
  it("hashes tokens one-way and compares in constant time", () => {
    const token = randomToken();
    expect(token).not.toBe(hashToken(token));
    expect(hashToken(token)).toHaveLength(64);
    expect(tokensMatch(hashToken(token), hashToken(token))).toBe(true);
    expect(tokensMatch(hashToken(token), hashToken("other"))).toBe(false);
  });
});

describe("authorization policy", () => {
  const base = {
    id: "user-1",
    isAdmin: false,
    roomBookingEnabled: false,
    disabledAt: null,
    passwordHash: "hash",
    emailVerifiedAt: new Date(),
  };

  it("denies admin and rooms to a course-only user", () => {
    expect(canAdminister(base)).toBe(false);
    expect(canAccessRooms(base)).toBe(false);
    expect(canAccessStaffLists(base)).toBe(false);
    expect(canAuthenticate(base)).toBe(true);
  });

  it("allows rooms only when the capability is granted and the account is enabled", () => {
    expect(canAccessRooms({...base, roomBookingEnabled: true})).toBe(true);
    expect(
      canAccessRooms({
        ...base,
        roomBookingEnabled: true,
        disabledAt: new Date(),
      }),
    ).toBe(false);
  });

  it("allows staff lists only for enabled admins", () => {
    expect(canAccessStaffLists({...base, isAdmin: true})).toBe(true);
    expect(
      canAccessStaffLists({
        ...base,
        isAdmin: true,
        disabledAt: new Date(),
      }),
    ).toBe(false);
  });

  it("blocks authentication until the password is set and the account is enabled", () => {
    expect(canAuthenticate({...base, passwordHash: null})).toBe(false);
    expect(canAuthenticate({...base, emailVerifiedAt: null})).toBe(false);
    expect(canAuthenticate({...base, disabledAt: new Date()})).toBe(false);
  });
});

describe("signed-in home", () => {
  it("sends course users to account, therapists to rooms, admins to the directory", async () => {
    const {signedInHomePath} = await import("./signed-in-home");
    expect(signedInHomePath({isAdmin: false})).toBe("/account");
    expect(signedInHomePath({isAdmin: false, roomBookingEnabled: true})).toBe("/rooms");
    expect(signedInHomePath({isAdmin: true})).toBe("/admin/users");
  });
});

describe("post-login redirect safety", () => {
  it("only follows locale-prefixed internal paths", () => {
    expect(safeInternalPath("/fr/admin/users", "fr")).toBe("/fr/admin/users");
    expect(safeInternalPath("https://evil.example/fr", "fr")).toBe("/fr");
    expect(safeInternalPath("//evil.example", "fr")).toBe("/fr");
    expect(safeInternalPath("/de/admin", "fr")).toBe("/de/admin");
    expect(safeInternalPath("/not-a-locale", "en")).toBe("/en");
  });
});

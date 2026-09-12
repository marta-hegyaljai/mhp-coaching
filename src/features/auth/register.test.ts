import {describe, expect, it} from "vitest";

import {optionalContactErrors, parseOptionalContact} from "@/features/auth/contact";
import {registerAccount} from "@/features/auth/register";

describe("registerAccount validation", () => {
  it("returns password field errors without clearing the submitted names", async () => {
    const result = await registerAccount({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.test",
      password: "short",
      passwordConfirm: "short",
      locale: "en",
    });

    expect(result).toEqual({
      ok: false,
      fieldErrors: {password: true},
    });
  });
});

describe("optional profile contact", () => {
  it("accepts empty fields and rejects a short phone", () => {
    expect(parseOptionalContact({
      phone: "",
      street: "",
      postalCode: "",
      city: "",
      country: "",
    })).toEqual({
      ok: true,
      contact: {phone: null, street: null, postalCode: null, city: null, country: null},
    });
    expect(optionalContactErrors({
      phone: "12",
      street: "",
      postalCode: "",
      city: "",
      country: "",
    })).toEqual({phone: true});
  });
});

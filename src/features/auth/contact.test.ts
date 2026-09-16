import {describe, expect, it} from "vitest";

import {
  checkoutDefaultsFromBooking,
  checkoutDefaultsFromUser,
  mergeCheckoutDefaults,
} from "./contact";

const account = {
  firstName: "Marta",
  lastName: "Hegyaljai",
  email: "marta@example.com",
  phone: "+41 79 000 00 01",
  street: null,
  postalCode: null,
  city: null,
  country: null,
};

const previousBooking = {
  firstName: "Marta",
  lastName: "Hegyaljai",
  email: "marta@example.com",
  dateOfBirth: "1975-12-10",
  phone: "+41 79 111 11 11",
  street: "Chemin de la Fenetta 42",
  postalCode: "1752",
  city: "Villars-sur-Glâne",
  country: "Suisse",
};

describe("checkout defaults", () => {
  it("keeps the account identity and fills missing address from a previous booking", () => {
    const merged = mergeCheckoutDefaults(
      checkoutDefaultsFromUser(account),
      checkoutDefaultsFromBooking(previousBooking),
    );

    expect(merged).toMatchObject({
      firstName: "Marta",
      lastName: "Hegyaljai",
      email: "marta@example.com",
      dateOfBirth: "1975-12-10",
      phone: "+41 79 000 00 01",
      street: "Chemin de la Fenetta 42",
      postalCode: "1752",
      city: "Villars-sur-Glâne",
      country: "Suisse",
    });
  });

  it("does not let an empty booking snapshot wipe account contact", () => {
    const merged = mergeCheckoutDefaults(
      checkoutDefaultsFromUser({
        ...account,
        phone: "+41 79 222 22 22",
        street: "Rue de Lausanne 1",
        postalCode: "1201",
        city: "Genève",
        country: "Suisse",
      }),
      checkoutDefaultsFromBooking({
        ...previousBooking,
        phone: "",
        street: "",
        postalCode: "",
        city: "",
        country: "",
      }),
    );

    expect(merged?.phone).toBe("+41 79 222 22 22");
    expect(merged?.street).toBe("Rue de Lausanne 1");
    expect(merged?.dateOfBirth).toBe("1975-12-10");
  });
});

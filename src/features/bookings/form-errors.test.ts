import {describe, expect, it} from "vitest";

import {
  bookingIssueLabelKeys,
  localizeBookingFormErrors,
  visibleBookingIssueKeys,
} from "./form-errors";
import {parseBookingForm} from "./validation";

describe("booking form issue helpers", () => {
  it("lists missing fields in reading order", () => {
    const parsed = parseBookingForm(new FormData());

    expect(visibleBookingIssueKeys(parsed.errors ?? {})).toEqual([
      "courseDateId",
      "firstName",
      "lastName",
      "email",
      "phone",
      "street",
      "postalCode",
      "city",
      "country",
      "privacyAccepted",
    ]);
  });

  it("maps issue keys to localized messages and field labels", () => {
    const localized = localizeBookingFormErrors(
      {firstName: "raw", email: "raw"},
      (key) => `t:${key}`,
    );

    expect(localized.firstName).toBe("t:firstName");
    expect(localized.email).toBe("t:email");
    expect(bookingIssueLabelKeys.privacyAccepted).toBe("privacyShort");
  });
});

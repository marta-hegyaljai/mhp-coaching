import {describe, expect, it} from "vitest";

import {emailTranslator} from "@/features/email/catalog";

describe("email catalog translator", () => {
  it("resolves room billing copy without a Next request", () => {
    const t = emailTranslator("en", "Email.paymentSucceeded");
    expect(t("subject", {month: "August 2026"})).toContain("August 2026");
    expect(emailTranslator("xx", "Email.fields")("amount")).toBeTruthy();
  });
});

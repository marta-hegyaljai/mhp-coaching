import {afterEach, describe, expect, it} from "vitest";

import {PreviewMailBlockedError, sendMail} from "@/features/email/transport";

describe("sendMail preview guard", () => {
  const previousEnv = process.env.VERCEL_ENV;

  afterEach(() => {
    if (previousEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = previousEnv;
    }
  });

  it("refuses delivery on Vercel preview deployments", async () => {
    process.env.VERCEL_ENV = "preview";
    await expect(
      sendMail({
        to: "buyer@example.test",
        subject: "Should not send",
        text: "Blocked",
        html: "<p>Blocked</p>",
      }),
    ).rejects.toBeInstanceOf(PreviewMailBlockedError);
  });
});

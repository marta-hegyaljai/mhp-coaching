import {describe, expect, it} from "vitest";

import {getResendApiKey, getResendFromAddress} from "./credentials";

describe("getResendApiKey", () => {
  it("prefers the connected Vercel marketplace key", () => {
    expect(
      getResendApiKey({
        RESEND_API_KEY: "re_portable",
        EMAILS_RESEND_RESEND_API_KEY: "re_vercel",
      }),
    ).toBe("re_vercel");
  });

  it("uses the Vercel marketplace alias when RESEND_API_KEY is missing", () => {
    expect(
      getResendApiKey({
        EMAILS_RESEND_RESEND_API_KEY: "re_vercel",
      }),
    ).toBe("re_vercel");
  });

  it("ignores blank RESEND_API_KEY values", () => {
    expect(
      getResendApiKey({
        RESEND_API_KEY: "  ",
        EMAILS_RESEND_RESEND_API_KEY: "re_vercel",
      }),
    ).toBe("re_vercel");
  });

  it("accepts another Vercel resource prefix", () => {
    expect(
      getResendApiKey({
        MAIL_RESEND_RESEND_API_KEY: "re_other_store",
      }),
    ).toBe("re_other_store");
  });

  it("returns undefined when no API key is configured", () => {
    expect(getResendApiKey({})).toBeUndefined();
  });
});

describe("getResendFromAddress", () => {
  it("prefers RESEND_FROM", () => {
    expect(
      getResendFromAddress({
        RESEND_FROM: "MHP Coaching <contact@mhp-coaching.ch>",
        EMAILS_RESEND_RESEND_EMAIL_DOMAIN: "other.example",
      }),
    ).toBe("MHP Coaching <contact@mhp-coaching.ch>");
  });

  it("builds a mailbox from the Vercel Resend domain", () => {
    expect(
      getResendFromAddress({
        EMAILS_RESEND_RESEND_EMAIL_DOMAIN: "mhp-coaching.ch",
      }),
    ).toBe("MHP Coaching <contact@mhp-coaching.ch>");
  });

  it("builds a mailbox from a portable domain alias", () => {
    expect(
      getResendFromAddress({
        RESEND_EMAIL_DOMAIN: "https://mail.mhp-coaching.ch/",
      }),
    ).toBe("MHP Coaching <contact@mail.mhp-coaching.ch>");
  });

  it("treats a domain value that is already an address as the mailbox", () => {
    expect(
      getResendFromAddress({
        EMAILS_RESEND_RESEND_EMAIL_DOMAIN: "hello@mhp-coaching.ch",
      }),
    ).toBe("MHP Coaching <hello@mhp-coaching.ch>");
  });

  it("falls back to SMTP_FROM before the local default", () => {
    expect(
      getResendFromAddress({
        SMTP_FROM: "MHP Coaching <contact@mhp-coaching.ch>",
      }),
    ).toBe("MHP Coaching <contact@mhp-coaching.ch>");
  });

  it("uses the local no-reply mailbox when nothing is configured", () => {
    expect(getResendFromAddress({})).toBe("MHP Coaching <no-reply@mhp.local>");
  });
});

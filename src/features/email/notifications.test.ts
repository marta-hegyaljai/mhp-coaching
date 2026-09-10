import {beforeEach, describe, expect, it, vi} from "vitest";

import type {Booking, Inquiry, WaitlistEntry} from "@/db/schema";
import {organization} from "@/features/organization/info";
import en from "../../../messages/en.json";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(),
}));

vi.mock("./transport", () => ({
  sendMail: vi.fn(),
}));

vi.mock("@/features/bookings/repository", () => ({
  getBookingById: vi.fn(),
}));

import {getTranslations} from "next-intl/server";
import {getBookingById} from "@/features/bookings/repository";

import {sendBookingConfirmation} from "./booking-confirmation";
import {sendInquiryNotification} from "./inquiry-notification";
import {sendLeadNotification} from "./lead-notification";
import {sendPurchaseNotification} from "./purchase-notification";
import {sendWaitlistNotification} from "./waitlist-notification";
import {sendMail} from "./transport";

const getTranslationsMock = vi.mocked(getTranslations);
const sendMailMock = vi.mocked(sendMail);
const getBookingByIdMock = vi.mocked(getBookingById);

function interpolate(
  tree: Record<string, string>,
  key: string,
  values?: Record<string, string>,
): string {
  let template = tree[key];
  if (!template) {
    throw new Error(`Missing message ${key}`);
  }
  if (values) {
    for (const [name, value] of Object.entries(values)) {
      template = template.replaceAll(`{${name}}`, value);
    }
  }
  return template;
}

function translatorFor(namespacePath: string) {
  const keys = namespacePath.replace(/^Email\.?/, "").split(".").filter(Boolean);
  let node: unknown = en.Email;

  for (const key of keys) {
    node = (node as Record<string, unknown>)[key];
  }

  return ((key: string, values?: Record<string, string>) =>
    interpolate(node as Record<string, string>, key, values)) as Awaited<
    ReturnType<typeof getTranslations>
  >;
}

function mockEmailCatalogues() {
  getTranslationsMock.mockImplementation(async (opts) => {
    const requested =
      opts && typeof opts === "object" && "namespace" in opts
        ? String((opts as {namespace?: string}).namespace ?? "")
        : "";
    return translatorFor(requested);
  });
}

function expectSharedChrome(html: string) {
  expect(html).toContain("<!DOCTYPE html>");
  expect(html).toContain('role="presentation"');
  expect(html).toContain("#c8aa6a");
  expect(html).toContain("#090909");
  expect(html).toContain("Georgia");
  expect(html).toContain(organization.brandName);
  expect(html).toContain(organization.email);
}

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "22222222-2222-2222-2222-222222222222",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    phone: "+41 79 000 00 00",
    street: "Chemin de la Fenetta 42",
    postalCode: "1752",
    city: "Villars-sur-Glâne",
    country: "CH",
    locale: "en",
    courseId: "omni-practitioner",
    courseDateId: "omni-practitioner-2026-09-10",
    courseTitle: "OMNI Hypnosis Practitioner",
    courseDateStart: "2026-09-10",
    courseDateEnd: "2026-09-20",
    location: "Fribourg",
    amountMinor: 349000,
    currency: "chf",
    paymentProvider: "fake",
    paymentReference: "fake-ref",
    status: "PAID",
    paidAt: new Date("2026-01-01T00:00:00.000Z"),
    confirmationEmailSentAt: null,
    privacyAcceptedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("staff email destinations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendMailMock.mockResolvedValue(undefined);
    mockEmailCatalogues();
  });

  it("notifies contact@mhp-coaching.ch when a purchase succeeds", async () => {
    await sendPurchaseNotification(booking(), "paid");

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: organization.email,
        replyTo: "ada@example.com",
        subject: "Payment received — OMNI Hypnosis Practitioner",
      }),
    );
    const html = sendMailMock.mock.calls[0]?.[0].html ?? "";
    expect(sendMailMock.mock.calls[0]?.[0].text).toContain("Status: Paid");
    expect(html).toContain("Payment received");
    expectSharedChrome(html);
  });

  it("notifies contact@mhp-coaching.ch when a purchase fails", async () => {
    await sendPurchaseNotification(booking({status: "FAILED"}), "failed");

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: organization.email,
        subject: "Payment failed — OMNI Hypnosis Practitioner",
      }),
    );
    const html = sendMailMock.mock.calls[0]?.[0].html ?? "";
    expect(sendMailMock.mock.calls[0]?.[0].text).toContain("Status: Failed");
    expect(html).toContain("Payment failed");
    expectSharedChrome(html);
  });

  it("notifies contact@mhp-coaching.ch for a contact form message", async () => {
    getBookingByIdMock.mockResolvedValue(undefined);
    const inquiry: Inquiry = {
      id: "33333333-3333-3333-3333-333333333333",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+41 79 000 00 00",
      message: "I would like details about the next course.",
      locale: "en",
      kind: "general",
      bookingId: null,
      courseId: null,
      courseTitle: null,
    };

    await sendInquiryNotification(inquiry);

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: organization.email,
        replyTo: "ada@example.com",
        subject: "Website message — contact",
      }),
    );
    const html = sendMailMock.mock.calls[0]?.[0].html ?? "";
    expect(html).toContain("I would like details about the next course.");
    expectSharedChrome(html);
  });

  it("notifies contact@mhp-coaching.ch for a payment-method inquiry", async () => {
    getBookingByIdMock.mockResolvedValue(booking());
    const inquiry: Inquiry = {
      id: "44444444-4444-4444-4444-444444444444",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+41 79 000 00 00",
      message: "I would rather pay by bank transfer.",
      locale: "en",
      kind: "payment",
      bookingId: booking().id,
      courseId: booking().courseId,
      courseTitle: booking().courseTitle,
    };

    await sendInquiryNotification(inquiry);

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: organization.email,
        subject: "Website message — payment",
      }),
    );
    expectSharedChrome(sendMailMock.mock.calls[0]?.[0].html ?? "");
  });

  it("notifies contact@mhp-coaching.ch when a lead booking is saved", async () => {
    await sendLeadNotification(booking({status: "LEAD"}));

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: organization.email,
        replyTo: "ada@example.com",
        subject:
          "Booking request without online payment — OMNI Hypnosis Practitioner",
      }),
    );
    expectSharedChrome(sendMailMock.mock.calls[0]?.[0].html ?? "");
  });

  it("notifies contact@mhp-coaching.ch when someone joins a waiting list", async () => {
    const entry: WaitlistEntry = {
      id: "55555555-5555-5555-5555-555555555555",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      courseId: "omni-practitioner",
      courseTitle: "OMNI Hypnosis Practitioner",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "+41 79 000 00 00",
      locale: "en",
      privacyAcceptedAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    await sendWaitlistNotification(entry);

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: organization.email,
        replyTo: "ada@example.com",
        subject: "Waiting list — OMNI Hypnosis Practitioner",
      }),
    );
    expectSharedChrome(sendMailMock.mock.calls[0]?.[0].html ?? "");
  });

  it("sends the purchase confirmation to the buyer", async () => {
    await sendBookingConfirmation(booking());

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ada@example.com",
        subject: "Booking confirmed — OMNI Hypnosis Practitioner",
      }),
    );
    const html = sendMailMock.mock.calls[0]?.[0].html ?? "";
    expect(html).toContain("OMNI Hypnosis Practitioner");
    expect(html).toContain("Booking confirmed");
    expect(html).toContain(organization.courseVenueAddress);
    expect(html).not.toContain(booking().id);
    expect(sendMailMock.mock.calls[0]?.[0].to).not.toBe(organization.email);
    expectSharedChrome(html);
  });
});

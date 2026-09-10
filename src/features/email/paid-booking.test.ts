import {beforeEach, describe, expect, it, vi} from "vitest";

import type {Booking} from "@/db/schema";

vi.mock("@/features/bookings/repository", () => ({
  markConfirmationEmailSent: vi.fn(),
}));

vi.mock("./booking-confirmation", () => ({
  sendBookingConfirmation: vi.fn(),
}));

vi.mock("./purchase-notification", () => ({
  sendPurchaseNotification: vi.fn(),
}));

import {markConfirmationEmailSent} from "@/features/bookings/repository";

import {sendBookingConfirmation} from "./booking-confirmation";
import {sendBuyerConfirmationIfNeeded} from "./paid-booking";

const sendBookingConfirmationMock = vi.mocked(sendBookingConfirmation);
const markConfirmationEmailSentMock = vi.mocked(markConfirmationEmailSent);

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "33333333-3333-3333-3333-333333333333",
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
    courseId: "stripe-payment-test",
    courseDateId: "stripe-payment-test-2026-09-21",
    courseTitle: "Internal test — Stripe payment",
    courseDateStart: "2026-09-21",
    courseDateEnd: null,
    location: "Fribourg",
    amountMinor: 1000,
    currency: "chf",
    paymentProvider: "stripe",
    paymentReference: "cs_test",
    status: "PAID",
    paidAt: new Date("2026-01-01T00:00:00.000Z"),
    confirmationEmailSentAt: null,
    privacyAcceptedAt: new Date("2026-01-01T00:00:00.000Z"),
    userId: null,
    emailNormalized: "ada@example.com",
    ...overrides,
  };
}

describe("sendBuyerConfirmationIfNeeded", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendBookingConfirmationMock.mockResolvedValue(undefined);
    markConfirmationEmailSentMock.mockResolvedValue(undefined);
  });

  it("sends the buyer confirmation once and records that it was delivered", async () => {
    const paid = booking();

    await expect(sendBuyerConfirmationIfNeeded(paid)).resolves.toBe(true);

    expect(sendBookingConfirmationMock).toHaveBeenCalledWith(paid);
    expect(markConfirmationEmailSentMock).toHaveBeenCalledWith(paid.id);
  });

  it("does not send again when the confirmation was already recorded", async () => {
    const paid = booking({confirmationEmailSentAt: new Date()});

    await expect(sendBuyerConfirmationIfNeeded(paid)).resolves.toBe(true);

    expect(sendBookingConfirmationMock).not.toHaveBeenCalled();
    expect(markConfirmationEmailSentMock).not.toHaveBeenCalled();
  });

  it("returns false when delivery fails so the webhook can retry", async () => {
    sendBookingConfirmationMock.mockRejectedValue(new Error("Resend 403"));

    await expect(sendBuyerConfirmationIfNeeded(booking())).resolves.toBe(false);

    expect(markConfirmationEmailSentMock).not.toHaveBeenCalled();
  });
});

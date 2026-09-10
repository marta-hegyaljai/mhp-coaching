import {beforeEach, describe, expect, it, vi} from "vitest";

import type {Booking} from "@/db/schema";

vi.mock("@/features/bookings/repository", () => ({
  getBookingById: vi.fn(),
  markBookingPaidOnce: vi.fn(),
  markBookingStatus: vi.fn(),
  markConfirmationEmailSent: vi.fn(),
  recordPaymentEvent: vi.fn(),
}));

vi.mock("@/features/email/booking-confirmation", () => ({
  sendBookingConfirmation: vi.fn(),
}));

vi.mock("@/features/email/purchase-notification", () => ({
  sendPurchaseNotification: vi.fn(),
}));

import {
  getBookingById,
  markBookingPaidOnce,
  markBookingStatus,
  markConfirmationEmailSent,
  recordPaymentEvent,
} from "@/features/bookings/repository";
import {sendBookingConfirmation} from "@/features/email/booking-confirmation";
import {sendPurchaseNotification} from "@/features/email/purchase-notification";

import {applyPaymentEvent} from "./apply-event";

const getBookingByIdMock = vi.mocked(getBookingById);
const markBookingPaidOnceMock = vi.mocked(markBookingPaidOnce);
const markBookingStatusMock = vi.mocked(markBookingStatus);
const markConfirmationEmailSentMock = vi.mocked(markConfirmationEmailSent);
const recordPaymentEventMock = vi.mocked(recordPaymentEvent);
const sendBookingConfirmationMock = vi.mocked(sendBookingConfirmation);
const sendPurchaseNotificationMock = vi.mocked(sendPurchaseNotification);

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "11111111-1111-1111-1111-111111111111",
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
    locale: "fr",
    courseId: "omni-practitioner",
    courseDateId: "omni-practitioner-2026-09-10",
    courseTitle: "Praticien·ne en Hypnose OMNI®",
    courseDateStart: "2026-09-10",
    courseDateEnd: "2026-09-20",
    location: "Fribourg",
    amountMinor: 349000,
    currency: "chf",
    paymentProvider: "fake",
    paymentReference: "fake-ref",
    status: "PENDING",
    paidAt: null,
    confirmationEmailSentAt: null,
    privacyAcceptedAt: new Date("2026-01-01T00:00:00.000Z"),
    userId: null,
    emailNormalized: "ada@example.com",
    ...overrides,
  };
}

describe("applyPaymentEvent mail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBookingByIdMock.mockResolvedValue(booking());
    recordPaymentEventMock.mockResolvedValue("recorded");
  });

  it("emails the buyer and staff after a newly paid booking", async () => {
    const paid = booking({status: "PAID", paidAt: new Date()});
    markBookingPaidOnceMock.mockResolvedValue({booking: paid, alreadyPaid: false});

    await expect(
      applyPaymentEvent({
        bookingId: paid.id,
        provider: "fake",
        providerEventId: "evt-paid-1",
        type: "paid",
      }),
    ).resolves.toEqual({ok: true});

    expect(sendBookingConfirmationMock).toHaveBeenCalledWith(paid);
    expect(markConfirmationEmailSentMock).toHaveBeenCalledWith(paid.id);
    expect(sendPurchaseNotificationMock).toHaveBeenCalledWith(paid, "paid");
  });

  it("emails staff after a failed purchase without writing to the buyer", async () => {
    const failed = booking({status: "FAILED"});
    markBookingStatusMock.mockResolvedValue(failed);

    await expect(
      applyPaymentEvent({
        bookingId: failed.id,
        provider: "stripe",
        providerEventId: "evt-failed-1",
        type: "failed",
      }),
    ).resolves.toEqual({ok: true});

    expect(sendBookingConfirmationMock).not.toHaveBeenCalled();
    expect(sendPurchaseNotificationMock).toHaveBeenCalledWith(failed, "failed");
  });

  it("does not send mail for a duplicate payment event", async () => {
    recordPaymentEventMock.mockResolvedValue("duplicate");

    await expect(
      applyPaymentEvent({
        bookingId: booking().id,
        provider: "stripe",
        providerEventId: "evt-dup",
        type: "paid",
      }),
    ).resolves.toEqual({ok: true, alreadyProcessed: true});

    expect(markBookingPaidOnceMock).not.toHaveBeenCalled();
    expect(sendBookingConfirmationMock).not.toHaveBeenCalled();
    expect(sendPurchaseNotificationMock).not.toHaveBeenCalled();
  });

  it("does not email staff when checkout is only cancelled", async () => {
    const cancelled = booking({status: "CANCELLED"});
    markBookingStatusMock.mockResolvedValue(cancelled);

    await expect(
      applyPaymentEvent({
        bookingId: cancelled.id,
        provider: "fake",
        providerEventId: "evt-cancel-1",
        type: "cancelled",
      }),
    ).resolves.toEqual({ok: true});

    expect(sendPurchaseNotificationMock).not.toHaveBeenCalled();
    expect(sendBookingConfirmationMock).not.toHaveBeenCalled();
  });
});

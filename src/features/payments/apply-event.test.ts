import {beforeEach, describe, expect, it, vi} from "vitest";

import type {Booking} from "@/db/schema";

vi.mock("@/features/bookings/repository", () => ({
  getBookingById: vi.fn(),
  markBookingPaidOnce: vi.fn(),
  markBookingStatus: vi.fn(),
  markConfirmationEmailSent: vi.fn(),
  recordPaymentEvent: vi.fn(),
}));

vi.mock("@/features/email/paid-booking", () => ({
  sendBuyerConfirmationIfNeeded: vi.fn(),
  sendStaffPaidNotification: vi.fn(),
  sendStaffFailedNotification: vi.fn(),
}));

import {
  getBookingById,
  markBookingPaidOnce,
  markBookingStatus,
  recordPaymentEvent,
} from "@/features/bookings/repository";
import {
  sendBuyerConfirmationIfNeeded,
  sendStaffFailedNotification,
  sendStaffPaidNotification,
} from "@/features/email/paid-booking";

import {applyPaymentEvent} from "./apply-event";

const getBookingByIdMock = vi.mocked(getBookingById);
const markBookingPaidOnceMock = vi.mocked(markBookingPaidOnce);
const markBookingStatusMock = vi.mocked(markBookingStatus);
const recordPaymentEventMock = vi.mocked(recordPaymentEvent);
const sendBuyerConfirmationIfNeededMock = vi.mocked(
  sendBuyerConfirmationIfNeeded,
);
const sendStaffPaidNotificationMock = vi.mocked(sendStaffPaidNotification);
const sendStaffFailedNotificationMock = vi.mocked(sendStaffFailedNotification);

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
    sendBuyerConfirmationIfNeededMock.mockResolvedValue(true);
  });

  it("emails the buyer and staff after a newly paid booking", async () => {
    const paid = booking({status: "PAID", paidAt: new Date()});
    markBookingPaidOnceMock.mockResolvedValue({
      booking: paid,
      alreadyPaid: false,
    });

    await expect(
      applyPaymentEvent({
        bookingId: paid.id,
        provider: "fake",
        providerEventId: "evt-paid-1",
        type: "paid",
      }),
    ).resolves.toEqual({ok: true, confirmationEmailSent: true});

    expect(sendBuyerConfirmationIfNeededMock).toHaveBeenCalledWith(paid);
    expect(sendStaffPaidNotificationMock).toHaveBeenCalledWith(paid);
  });

  it("retries the buyer confirmation when a paid event is replayed", async () => {
    const paid = booking({status: "PAID", paidAt: new Date()});
    recordPaymentEventMock.mockResolvedValue("duplicate");
    markBookingPaidOnceMock.mockResolvedValue({
      booking: paid,
      alreadyPaid: true,
    });
    sendBuyerConfirmationIfNeededMock.mockResolvedValue(true);

    await expect(
      applyPaymentEvent({
        bookingId: paid.id,
        provider: "stripe",
        providerEventId: "evt-dup",
        type: "paid",
      }),
    ).resolves.toEqual({
      ok: true,
      alreadyProcessed: true,
      confirmationEmailSent: true,
    });

    expect(sendBuyerConfirmationIfNeededMock).toHaveBeenCalledWith(paid);
    expect(sendStaffPaidNotificationMock).not.toHaveBeenCalled();
  });

  it("retries the buyer confirmation on a later paid event without a second staff mail", async () => {
    const paid = booking({status: "PAID", paidAt: new Date()});
    markBookingPaidOnceMock.mockResolvedValue({
      booking: paid,
      alreadyPaid: true,
    });
    sendBuyerConfirmationIfNeededMock.mockResolvedValue(false);

    await expect(
      applyPaymentEvent({
        bookingId: paid.id,
        provider: "stripe",
        providerEventId: "evt-async-paid",
        type: "paid",
      }),
    ).resolves.toEqual({
      ok: true,
      alreadyProcessed: true,
      confirmationEmailSent: false,
    });

    expect(sendBuyerConfirmationIfNeededMock).toHaveBeenCalledWith(paid);
    expect(sendStaffPaidNotificationMock).not.toHaveBeenCalled();
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

    expect(sendBuyerConfirmationIfNeededMock).not.toHaveBeenCalled();
    expect(sendStaffFailedNotificationMock).toHaveBeenCalledWith(failed);
  });

  it("does not send mail for a duplicate cancelled event", async () => {
    recordPaymentEventMock.mockResolvedValue("duplicate");

    await expect(
      applyPaymentEvent({
        bookingId: booking().id,
        provider: "stripe",
        providerEventId: "evt-dup-cancel",
        type: "cancelled",
      }),
    ).resolves.toEqual({ok: true, alreadyProcessed: true});

    expect(markBookingStatusMock).not.toHaveBeenCalled();
    expect(sendStaffPaidNotificationMock).not.toHaveBeenCalled();
    expect(sendStaffFailedNotificationMock).not.toHaveBeenCalled();
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

    expect(sendStaffPaidNotificationMock).not.toHaveBeenCalled();
    expect(sendStaffFailedNotificationMock).not.toHaveBeenCalled();
    expect(sendBuyerConfirmationIfNeededMock).not.toHaveBeenCalled();
  });
});

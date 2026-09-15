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
import {sendCourseCallConfirmation, sendCourseCallStaffNotification, sendCourseInquiryStaffNotification} from "./course-call";
import {sendAccountInvitation} from "./invitation";
import {sendAdminCreatedRoomBooking, sendAdminMovedRoomBooking, sendRoomBookingConfirmed, sendRoomBookingReminder, sendStatementPaymentFailedMail} from "./room-booking";
import {
  sendEmailVerification,
  sendPasswordRecovery,
} from "./account";
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
    dateOfBirth: "1975-12-10",
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
    userId: null,
    emailNormalized: "ada@example.com",
    ...overrides,
  };
}

describe("staff email destinations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendMailMock.mockResolvedValue({provider: "smtp", messageId: "test-message-id"});
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
    expect(sendMailMock.mock.calls[0]?.[0].text).toContain(
      "Date of birth: 10 December 1975",
    );
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

  it("sends the invitation to the invited user, not staff", async () => {
    await sendAccountInvitation({
      locale: "en",
      rawToken: "invite-token-example",
      user: {
        id: "66666666-6666-6666-6666-666666666666",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        email: "theo@example.com",
        emailNormalized: "theo@example.com",
        emailVerifiedAt: null,
        passwordHash: null,
        firstName: "Theo",
        lastName: "Therapist",
        locale: "en",
        isAdmin: false,
        roomBookingEnabled: true,
        roomDiscountPercent: 0,
        stripeCustomerId: null,
        stripePaymentMethodId: null,
        paymentMethodBrand: null,
        paymentMethodLast4: null,
        paymentMethodExpMonth: null,
        paymentMethodExpYear: null,
        disabledAt: null,
        pendingEmail: null,
        pendingEmailNormalized: null,
        phone: null,
        street: null,
        postalCode: null,
        city: null,
        country: null,
      },
    });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "theo@example.com",
        subject: "Your MHP account invitation",
      }),
    );
    const html = sendMailMock.mock.calls[0]?.[0].html ?? "";
    const text = sendMailMock.mock.calls[0]?.[0].text ?? "";
    expect(html).toContain("Create your password");
    expect(html).toContain("invite-token-example");
    expect(html).toContain('href="http://localhost:3000/en/invite/invite-token-example"');
    expect(text).toContain("invite-token-example");
    expect(sendMailMock.mock.calls[0]?.[0].to).not.toBe(organization.email);
    expectSharedChrome(html);
  });

  it("sends verification and recovery mail to the user", async () => {
    await sendEmailVerification({
      to: "ada@example.com",
      firstName: "Ada",
      locale: "en",
      rawToken: "verify-token-example",
    });
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ada@example.com",
        subject: "Confirm your MHP account",
      }),
    );
    const verificationHtml = sendMailMock.mock.calls.at(-1)?.[0].html ?? "";
    expectSharedChrome(verificationHtml);
    expect(sendMailMock.mock.calls.at(-1)?.[0].text).toContain("verify-token-example");
    expect(verificationHtml).toContain("verify-token-example");
    expect(verificationHtml).toContain(
      'href="http://localhost:3000/en/verify-email/verify-token-example"',
    );

    await sendPasswordRecovery({
      to: "ada@example.com",
      firstName: "Ada",
      locale: "en",
      rawToken: "recovery-token-example",
    });
    expect(sendMailMock.mock.calls.at(-1)?.[0].subject).toBe("Reset your MHP password");
    expectSharedChrome(sendMailMock.mock.calls.at(-1)?.[0].html ?? "");
  });

  it("sends admin-created and admin-moved room mail to the user, not staff", async () => {
    const user = {
      id: "77777777-7777-4777-8777-777777777777",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      email: "theo@example.com",
      emailNormalized: "theo@example.com",
      emailVerifiedAt: new Date("2026-01-01T00:00:00.000Z"),
      passwordHash: "hash",
      firstName: "Theo",
      lastName: "Therapist",
      locale: "en",
      isAdmin: false,
      roomBookingEnabled: true,
      roomDiscountPercent: 0,
      stripeCustomerId: null,
      stripePaymentMethodId: null,
      paymentMethodBrand: null,
      paymentMethodLast4: null,
      paymentMethodExpMonth: null,
      paymentMethodExpYear: null,
      disabledAt: null,
      pendingEmail: null,
      pendingEmailNormalized: null,
      phone: null,
      street: null,
      postalCode: null,
      city: null,
      country: null,
    };
    const booking = {
      id: "88888888-8888-4888-8888-888888888888",
      createdAt: new Date("2026-09-11T08:00:00.000Z"),
      updatedAt: new Date("2026-09-11T08:00:00.000Z"),
      roomId: "99999999-9999-4999-8999-999999999999",
      userId: user.id,
      createdByUserId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      startsAt: new Date("2026-09-21T08:00:00.000Z"),
      endsAt: new Date("2026-09-21T09:00:00.000Z"),
      status: "CONFIRMED" as const,
      billingOutcome: "USAGE" as const,
      cancelledAt: null,
      cancelledByUserId: null,
      waivedAt: null,
      waivedByUserId: null,
      successorBookingId: null,
      roomName: "Salon Lavaux",
      baseHourlyRateMinor: 4500,
      discountPercent: 0,
      effectiveHourlyRateMinor: 4500,
      durationMinutes: 60,
      amountMinor: 4500,
      currency: "CHF",
    };

    await sendAdminCreatedRoomBooking({user, booking});
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "theo@example.com",
        subject: "Room booking created — Salon Lavaux",
      }),
    );
    const createdHtml = sendMailMock.mock.calls.at(-1)?.[0].html ?? "";
    const createdText = sendMailMock.mock.calls.at(-1)?.[0].text ?? "";
    expect(createdHtml).toContain("Salon Lavaux");
    expect(createdHtml).not.toContain(booking.id);
    expect(createdText).not.toContain(booking.id);
    expect(createdHtml.toLowerCase()).not.toContain("private note");
    expect(createdText.toLowerCase()).not.toContain("private note");
    expect(createdHtml).not.toContain("ciphertext");
    expect(sendMailMock.mock.calls.at(-1)?.[0].to).not.toBe(organization.email);
    expectSharedChrome(createdHtml);

    await sendAdminMovedRoomBooking({user, booking});
    expect(sendMailMock.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        to: "theo@example.com",
        subject: "Room booking updated — Salon Lavaux",
      }),
    );
    const movedHtml = sendMailMock.mock.calls.at(-1)?.[0].html ?? "";
    expect(movedHtml).not.toContain(booking.id);
    expectSharedChrome(movedHtml);

    await sendRoomBookingConfirmed({user, booking});
    expect(sendMailMock.mock.calls.at(-1)?.[0].subject).toBe("Room booking confirmed — Salon Lavaux");
    expectSharedChrome(sendMailMock.mock.calls.at(-1)?.[0].html ?? "");

    await sendRoomBookingReminder({user, booking});
    expect(sendMailMock.mock.calls.at(-1)?.[0].subject).toBe("Room booking reminder — Salon Lavaux");
    expect(sendMailMock.mock.calls.at(-1)?.[0].html).toContain("Reminder");

    await sendStatementPaymentFailedMail({
      user,
      monthLabel: "August 2026",
      amount: "CHF 40.00",
    });
    const failedHtml = sendMailMock.mock.calls.at(-1)?.[0].html ?? "";
    expect(sendMailMock.mock.calls.at(-1)?.[0].to).toBe("theo@example.com");
    expect(failedHtml).toContain("Update your payment method");
    expect(failedHtml).toContain("August 2026");
    expect(failedHtml).not.toContain(booking.id);
    expectSharedChrome(failedHtml);
  });
});

describe("course advice emails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendMailMock.mockResolvedValue({provider: "smtp", messageId: "test-message-id"});
    mockEmailCatalogues();
  });

  const call = {
    id: "33333333-3333-4333-8333-333333333333",
    createdAt: new Date("2026-09-14T08:00:00.000Z"),
    startsAt: new Date("2026-09-21T07:00:00.000Z"),
    endsAt: new Date("2026-09-21T07:15:00.000Z"),
    status: "SCHEDULED" as const,
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    phone: "+41 79 000 00 00",
    locale: "en",
    courseId: "omni-practitioner",
    courseTitle: "OMNI Hypnosis Practitioner",
    message: "Is this suitable for physicians?",
    privacyAcceptedAt: new Date("2026-09-14T08:00:00.000Z"),
  };

  it("confirms the reserved call to the visitor and alerts staff", async () => {
    await sendCourseCallConfirmation(call);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ada@example.com",
        subject: "Your call with MHP is reserved",
      }),
    );
    const visitorHtml = sendMailMock.mock.calls[0]?.[0].html ?? "";
    expect(sendMailMock.mock.calls[0]?.[0].text).toContain("09:00–09:15");
    expect(visitorHtml).not.toContain(call.id);
    expectSharedChrome(visitorHtml);

    sendMailMock.mockClear();
    await sendCourseCallStaffNotification(call);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: organization.email,
        replyTo: "ada@example.com",
      }),
    );
    expectSharedChrome(sendMailMock.mock.calls[0]?.[0].html ?? "");
  });

  it("alerts staff when a written course question arrives", async () => {
    await sendCourseInquiryStaffNotification({
      id: "44444444-4444-4444-8444-444444444444",
      createdAt: new Date("2026-09-14T08:00:00.000Z"),
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "+41 79 000 00 00",
      message: "Is this suitable for physicians?",
      locale: "en",
      courseId: "omni-practitioner",
      courseTitle: "OMNI Hypnosis Practitioner",
      privacyAcceptedAt: new Date("2026-09-14T08:00:00.000Z"),
    });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: organization.email,
        replyTo: "ada@example.com",
        subject: "Course question — Ada Lovelace",
      }),
    );
    expectSharedChrome(sendMailMock.mock.calls[0]?.[0].html ?? "");
  });
});

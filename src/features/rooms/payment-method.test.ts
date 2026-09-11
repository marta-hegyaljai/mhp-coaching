import {afterAll, describe, expect, it} from "vitest";

import {closeDb} from "@/db";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {normalizeEmail} from "@/features/auth/email";
import {hashPassword} from "@/features/auth/password";
import {insertUser, listAuditForUser} from "@/features/auth/repository";
import {
  formatPaymentMethodLabel,
  paymentMethodFromUser,
} from "@/features/payments/billing-method";
import {
  isValidFakeBillingSetupToken,
  signFakeBillingSetupToken,
} from "@/features/payments/fake/billing-setup";
import {completeFakePaymentMethod} from "@/features/rooms/payment-method";
import {RoomError} from "@/features/rooms/errors";
import {getDatabaseUrl} from "@/lib/database-url";

const hasDatabase = Boolean(getDatabaseUrl());

describe("payment method display", () => {
  it("formats brand, last four and expiry without a PAN", () => {
    const label = formatPaymentMethodLabel({
      brand: "visa",
      last4: "4242",
      expMonth: 12,
      expYear: 2030,
      stripeCustomerId: "cus_fake",
      stripePaymentMethodId: "pm_fake",
    });
    expect(label).toBe("Visa •••• 4242 · 12/2030");
    expect(label).not.toMatch(/\d{13,}/);
  });

  it("signs and verifies fake setup tokens", () => {
    const userId = "11111111-1111-4111-8111-111111111111";
    const token = signFakeBillingSetupToken(userId);
    expect(isValidFakeBillingSetupToken(userId, token)).toBe(true);
    expect(isValidFakeBillingSetupToken(userId, "deadbeef")).toBe(false);
  });
});

describe.skipIf(!hasDatabase)("fake saved payment method", () => {
  afterAll(async () => {
    await closeDb();
  });

  it("stores only display metadata and audits the change", async () => {
    const email = `pm-${Date.now()}-${Math.random().toString(16).slice(2)}@user.test`;
    const therapist = await insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Theo",
      lastName: "Card",
      locale: "en",
      isAdmin: false,
      roomBookingEnabled: true,
      passwordHash: await hashPassword("user-password-12"),
      emailVerifiedAt: new Date(),
    });

    const updated = await completeFakePaymentMethod({
      actor: therapist,
      userId: therapist.id,
    });
    const method = paymentMethodFromUser(updated);
    expect(method).toMatchObject({
      brand: "visa",
      last4: "4242",
      expMonth: 12,
      expYear: 2030,
    });
    expect(updated.stripePaymentMethodId).toMatch(/^pm_fake_/);

    const events = await listAuditForUser(therapist.id);
    const changed = events.find((event) => event.action === AUDIT_ACTIONS.ROOM_PAYMENT_METHOD_CHANGED);
    expect(changed?.after).toMatchObject({brand: "visa", last4: "4242"});
    expect(JSON.stringify(changed)).not.toContain("pm_fake_");
  });

  it("rejects another therapist attaching a card", async () => {
    const oneEmail = `pm-a-${Date.now()}@user.test`;
    const twoEmail = `pm-b-${Date.now()}@user.test`;
    const one = await insertUser({
      email: oneEmail,
      emailNormalized: normalizeEmail(oneEmail),
      firstName: "A",
      lastName: "One",
      locale: "en",
      roomBookingEnabled: true,
      passwordHash: await hashPassword("user-password-12"),
      emailVerifiedAt: new Date(),
    });
    const two = await insertUser({
      email: twoEmail,
      emailNormalized: normalizeEmail(twoEmail),
      firstName: "B",
      lastName: "Two",
      locale: "en",
      roomBookingEnabled: true,
      passwordHash: await hashPassword("user-password-12"),
      emailVerifiedAt: new Date(),
    });

    await expect(
      completeFakePaymentMethod({actor: two, userId: one.id}),
    ).rejects.toBeInstanceOf(RoomError);
  });
});

import {afterAll, describe, expect, it} from "vitest";

import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {toAuditEventView} from "@/features/admin/audit-history";
import {
  parseAuditHistoryPage,
  userAuditHref,
} from "@/features/admin/audit-history-query";
import {closeDb} from "@/db";
import {getDatabaseUrl} from "@/lib/database-url";
import {hashPassword} from "@/features/auth/password";
import {normalizeEmail} from "@/features/auth/email";
import {
  insertUser,
  listAuditForUserPage,
  recordAudit,
} from "@/features/auth/repository";
import {localizedPathname} from "@/i18n/path";

function event(input: {
  action: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  actorUserId?: string | null;
}) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    createdAt: new Date("2026-09-12T06:40:48.176Z"),
    actorUserId: input.actorUserId ?? "22222222-2222-4222-8222-222222222222",
    action: input.action,
    before: input.before ?? null,
    after: input.after ?? null,
  };
}

describe("parseAuditHistoryPage", () => {
  it("uses page 1 for missing or invalid values", () => {
    expect(parseAuditHistoryPage({})).toBe(1);
    expect(parseAuditHistoryPage({history: "0"})).toBe(1);
    expect(parseAuditHistoryPage({history: ["nope"]})).toBe(1);
  });

  it("keeps the first positive page value", () => {
    expect(parseAuditHistoryPage({history: ["3", "9"]})).toBe(3);
  });
});

describe("userAuditHref", () => {
  it("omits the default page and keeps the history fragment", () => {
    expect(userAuditHref("user-1")).toEqual({
      pathname: "/admin/users/[id]",
      params: {id: "user-1"},
      query: undefined,
      hash: "account-history",
    });
    expect(
      localizedPathname("fr", userAuditHref("user-1", 4)),
    ).toBe("/fr/admin/users/user-1?history=4#account-history");
  });
});

describe("toAuditEventView", () => {
  it("shows only the room-booking flag when granting access", () => {
    const view = toAuditEventView(
      event({
        action: AUDIT_ACTIONS.ROOM_BOOKING_GRANTED,
        before: {
          isAdmin: false,
          disabled: false,
          pendingInvite: false,
          roomBookingEnabled: false,
          roomDiscountPercent: 0,
        },
        after: {
          isAdmin: false,
          disabled: false,
          pendingInvite: false,
          roomBookingEnabled: true,
          roomDiscountPercent: 0,
        },
      }),
      "en",
    );

    expect(view.changes).toEqual([
      {
        field: "roomBookingEnabled",
        before: {kind: "boolean", value: false},
        after: {kind: "boolean", value: true},
      },
    ]);
  });

  it("presents registration as email without dumping default flags", () => {
    const view = toAuditEventView(
      event({
        action: AUDIT_ACTIONS.USER_REGISTERED,
        before: {},
        after: {pendingInvite: false, emailNormalized: "ada@example.test"},
      }),
      "en",
    );

    expect(view.changes).toEqual([
      {
        field: "emailNormalized",
        before: null,
        after: {kind: "text", value: "ada@example.test"},
      },
    ]);
  });

  it("collapses duplicate discount keys and formats percents", () => {
    const view = toAuditEventView(
      event({
        action: AUDIT_ACTIONS.ROOM_DISCOUNT_CHANGED,
        before: {
          isAdmin: false,
          roomBookingEnabled: true,
          roomDiscountPercent: 0,
          discountPercent: 0,
          disabled: false,
          pendingInvite: false,
        },
        after: {
          isAdmin: false,
          roomBookingEnabled: true,
          roomDiscountPercent: 15,
          discountPercent: 15,
          disabled: false,
          pendingInvite: false,
        },
      }),
      "en",
    );

    expect(view.changes).toEqual([
      {
        field: "roomDiscountPercent",
        before: {kind: "percent", value: 0},
        after: {kind: "percent", value: 15},
      },
    ]);
  });

  it("summarizes a new booking slot without repeating it as a change", () => {
    const view = toAuditEventView(
      event({
        action: AUDIT_ACTIONS.ROOM_BOOKING_CREATED,
        after: {
          bookingId: "33333333-3333-4333-8333-333333333333",
          roomId: "44444444-4444-4444-8444-444444444444",
          roomName: "Cabinet Ouchy",
          startsAt: "2026-09-14T14:00:00.000Z",
          endsAt: "2026-09-14T15:30:00.000Z",
          durationMinutes: 90,
          amountMinor: 5250,
          currency: "CHF",
          discountPercent: 0,
        },
      }),
      "en",
    );

    expect(view.summary).toContain("Cabinet Ouchy");
    expect(view.changes.map((change) => change.field)).toEqual([
      "amountMinor",
      "durationMinutes",
    ]);
  });

  it("turns a card payload into one payment-method change", () => {
    const view = toAuditEventView(
      event({
        action: AUDIT_ACTIONS.ROOM_PAYMENT_METHOD_CHANGED,
        before: {brand: "visa", last4: "4242", expMonth: 1, expYear: 2027},
        after: {brand: "mastercard", last4: "4444", expMonth: 12, expYear: 2028},
      }),
      "en",
    );

    expect(view.changes).toEqual([
      {
        field: "paymentMethod",
        before: {
          kind: "card",
          brand: "visa",
          last4: "4242",
          expMonth: 1,
          expYear: 2027,
        },
        after: {
          kind: "card",
          brand: "mastercard",
          last4: "4444",
          expMonth: 12,
          expYear: 2028,
        },
      },
    ]);
  });

  it("keeps password-only events without a JSON payload", () => {
    const view = toAuditEventView(
      event({action: AUDIT_ACTIONS.PASSWORD_CHANGED}),
      "fr",
    );

    expect(view.changes).toEqual([]);
    expect(view.summary).toBeNull();
  });
});

const hasDatabase = Boolean(getDatabaseUrl());

describe.skipIf(!hasDatabase)("listAuditForUserPage", () => {
  afterAll(async () => {
    await closeDb();
  });

  it("pages a long audit trail newest first", async () => {
    const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `audit.page+${stamp}@example.test`;
    const target = await insertUser({
      email,
      emailNormalized: normalizeEmail(email),
      firstName: "Page",
      lastName: "Trail",
      locale: "en",
      passwordHash: await hashPassword("user-password-12"),
      emailVerifiedAt: new Date(),
    });

    for (let index = 0; index < 23; index += 1) {
      await recordAudit({
        actorUserId: target.id,
        targetUserId: target.id,
        action: AUDIT_ACTIONS.PASSWORD_CHANGED,
        after: {index},
      });
    }

    const first = await listAuditForUserPage(target.id, 1, {pageSize: 10});
    const second = await listAuditForUserPage(target.id, 2, {pageSize: 10});
    const last = await listAuditForUserPage(target.id, 99, {pageSize: 10});

    expect(first.total).toBeGreaterThanOrEqual(23);
    expect(first.pageCount).toBeGreaterThanOrEqual(3);
    expect(first.page).toBe(1);
    expect(first.events).toHaveLength(10);
    expect(second.events).toHaveLength(10);
    expect(last.page).toBe(first.pageCount);
    expect(last.events.length).toBeGreaterThan(0);
    expect(first.events.some((row) => second.events.some((other) => other.id === row.id))).toBe(
      false,
    );
    expect(first.events[0]?.createdAt.getTime()).toBeGreaterThanOrEqual(
      first.events[9]?.createdAt.getTime() ?? 0,
    );
  });
});

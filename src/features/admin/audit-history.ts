import type {AuditEvent} from "@/db/schema";
import {AUDIT_ACTIONS, type AuditAction} from "@/features/admin/audit-actions";
import {getCourseById} from "@/features/courses/queries";
import type {AppLocale} from "@/i18n/routing";
import {bookingSpanLabel} from "@/features/rooms/format";

export const AUDIT_FIELD_KEYS = [
  "isAdmin",
  "disabled",
  "pendingInvite",
  "roomBookingEnabled",
  "roomDiscountPercent",
  "emailNormalized",
  "firstName",
  "lastName",
  "locale",
  "course",
  "issuedOn",
  "status",
  "hasDocument",
  "slot",
  "durationMinutes",
  "amountMinor",
  "totalMinor",
  "discountPercent",
  "billingOutcome",
  "paymentMethod",
  "statementPeriod",
  "billedMinutes",
  "lineCount",
  "failureCode",
  "brand",
  "last4",
] as const;

export type AuditFieldKey = (typeof AUDIT_FIELD_KEYS)[number];

export const AUDIT_VALUE_KEYS = [
  "ACTIVE",
  "REVOKED",
  "CONFIRMED",
  "CANCELLED",
  "USAGE",
  "LATE_CANCELLATION",
  "FREE_CANCELLATION",
  "WAIVED",
  "OPEN",
  "FINALIZED",
  "PAYMENT_PENDING",
  "PAID",
  "PAYMENT_FAILED",
  "missing_payment_method",
] as const;

export type AuditValueKey = (typeof AUDIT_VALUE_KEYS)[number];

const auditValueKeySet = new Set<string>(AUDIT_VALUE_KEYS);
const auditFieldKeySet = new Set<string>(AUDIT_FIELD_KEYS);

export function isKnownAuditField(field: string): field is AuditFieldKey {
  return auditFieldKeySet.has(field);
}

export function isKnownAuditValue(value: string): value is AuditValueKey {
  return auditValueKeySet.has(value);
}

export type AuditValue =
  | {kind: "boolean"; value: boolean}
  | {kind: "text"; value: string}
  | {kind: "percent"; value: number}
  | {kind: "money"; minor: number}
  | {kind: "minutes"; value: number}
  | {kind: "integer"; value: number}
  | {kind: "instant"; iso: string}
  | {kind: "date"; iso: string}
  | {kind: "locale"; value: string}
  | {kind: "enum"; value: string}
  | {kind: "card"; brand: string; last4: string; expMonth: number; expYear: number}
  | {kind: "month"; year: number; month: number}
  | {kind: "empty"};

export type AuditChangeView = {
  field: string;
  before: AuditValue | null;
  after: AuditValue | null;
};

export type AuditEventView = {
  id: string;
  action: string;
  createdAt: Date;
  actorUserId: string | null;
  summary: string | null;
  changes: AuditChangeView[];
};

const SKIP_KEYS = new Set([
  "userId",
  "certificateId",
  "bookingId",
  "roomId",
  "statementId",
  "successorBookingId",
  "documentId",
  "lineId",
  "currency",
  "startsAt",
  "endsAt",
  "roomName",
  "courseId",
  "brand",
  "last4",
  "expMonth",
  "expYear",
  "year",
  "month",
]);

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T/;

type Snapshot = Record<string, unknown>;

function asRecord(value: unknown): Snapshot {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Snapshot;
  }
  return {};
}

function valuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }
  if (left == null && right == null) {
    return true;
  }
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}

function canonicalize(snapshot: Snapshot): Snapshot {
  const next = {...snapshot};
  if ("discountPercent" in next && "roomDiscountPercent" in next) {
    delete next.discountPercent;
  } else if ("discountPercent" in next && !("roomDiscountPercent" in next)) {
    next.roomDiscountPercent = next.discountPercent;
    delete next.discountPercent;
  }
  return next;
}

function shouldSkipKey(key: string): boolean {
  if (SKIP_KEYS.has(key)) {
    return true;
  }
  if (key.startsWith("stripe")) {
    return true;
  }
  return /Id$/.test(key);
}

function isCreateSnapshot(before: Snapshot): boolean {
  return Object.keys(before).length === 0;
}

function isNoisyCreateValue(key: string, value: unknown): boolean {
  if (typeof value === "boolean") {
    return value === false;
  }
  if (
    (key === "roomDiscountPercent" || key === "discountPercent") &&
    value === 0
  ) {
    return true;
  }
  return false;
}

function courseTitle(courseId: unknown, locale: AppLocale): string | null {
  if (typeof courseId !== "string" || !courseId) {
    return null;
  }
  const course = getCourseById(courseId);
  return course?.title[locale] ?? courseId;
}

function slotLabel(snapshot: Snapshot, locale: AppLocale): string | null {
  const roomName = typeof snapshot.roomName === "string" ? snapshot.roomName : "";
  const startsAt = typeof snapshot.startsAt === "string" ? snapshot.startsAt : "";
  const endsAt = typeof snapshot.endsAt === "string" ? snapshot.endsAt : "";
  if (!startsAt || !endsAt) {
    return roomName || null;
  }

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return roomName || null;
  }

  const span = bookingSpanLabel(start, end, locale);
  return roomName ? `${roomName} · ${span}` : span;
}

function cardValue(snapshot: Snapshot): AuditValue | null {
  const brand = typeof snapshot.brand === "string" ? snapshot.brand : "";
  const last4 = typeof snapshot.last4 === "string" ? snapshot.last4 : "";
  const expMonth = typeof snapshot.expMonth === "number" ? snapshot.expMonth : NaN;
  const expYear = typeof snapshot.expYear === "number" ? snapshot.expYear : NaN;
  if (!brand && !last4) {
    return null;
  }
  return {
    kind: "card",
    brand: brand || "Card",
    last4: last4 || "••••",
    expMonth: Number.isFinite(expMonth) ? expMonth : 0,
    expYear: Number.isFinite(expYear) ? expYear : 0,
  };
}

function monthValue(snapshot: Snapshot): AuditValue | null {
  const year = typeof snapshot.year === "number" ? snapshot.year : NaN;
  const month = typeof snapshot.month === "number" ? snapshot.month : NaN;
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return null;
  }
  return {kind: "month", year, month};
}

function toValue(key: string, value: unknown): AuditValue | null {
  if (value == null) {
    return {kind: "empty"};
  }
  if (typeof value === "boolean") {
    return {kind: "boolean", value};
  }
  if (key === "locale" && typeof value === "string") {
    return {kind: "locale", value};
  }
  if (
    (key === "roomDiscountPercent" || key === "discountPercent") &&
    typeof value === "number"
  ) {
    return {kind: "percent", value};
  }
  if ((key === "amountMinor" || key === "totalMinor") && typeof value === "number") {
    return {kind: "money", minor: value};
  }
  if (
    (key === "durationMinutes" || key === "billedMinutes") &&
    typeof value === "number"
  ) {
    return {kind: "minutes", value};
  }
  if (key === "lineCount" && typeof value === "number") {
    return {kind: "integer", value};
  }
  if (key === "issuedOn" && typeof value === "string" && ISO_DAY.test(value)) {
    return {kind: "date", iso: value};
  }
  if (
    (key === "status" || key === "billingOutcome" || key === "failureCode") &&
    typeof value === "string"
  ) {
    return {kind: "enum", value};
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return {kind: "integer", value};
  }
  if (typeof value === "string") {
    if (ISO_INSTANT.test(value)) {
      const instant = new Date(value);
      if (!Number.isNaN(instant.getTime())) {
        return {kind: "instant", iso: value};
      }
    }
    if (ISO_DAY.test(value)) {
      return {kind: "date", iso: value};
    }
    return {kind: "text", value};
  }
  return null;
}

function compositeChanges(
  before: Snapshot,
  after: Snapshot,
  locale: AppLocale,
): AuditChangeView[] {
  const changes: AuditChangeView[] = [];
  const beforeSlot = slotLabel(before, locale);
  const afterSlot = slotLabel(after, locale);
  if (beforeSlot && afterSlot && beforeSlot !== afterSlot) {
    changes.push({
      field: "slot",
      before: {kind: "text", value: beforeSlot},
      after: {kind: "text", value: afterSlot},
    });
  }

  const beforeCard = cardValue(before);
  const afterCard = cardValue(after);
  if (beforeCard || afterCard) {
    if (!valuesEqual(beforeCard, afterCard)) {
      changes.push({field: "paymentMethod", before: beforeCard, after: afterCard});
    }
  }

  const beforeMonth = monthValue(before);
  const afterMonth = monthValue(after);
  if (beforeMonth || afterMonth) {
    if (!valuesEqual(beforeMonth, afterMonth)) {
      changes.push({
        field: "statementPeriod",
        before: beforeMonth,
        after: afterMonth,
      });
    }
  }

  const beforeCourse = courseTitle(before.courseId, locale);
  const afterCourse = courseTitle(after.courseId, locale);
  if (beforeCourse || afterCourse) {
    if (beforeCourse !== afterCourse) {
      changes.push({
        field: "course",
        before: beforeCourse ? {kind: "text", value: beforeCourse} : null,
        after: afterCourse ? {kind: "text", value: afterCourse} : null,
      });
    }
  }

  return changes;
}

function keysToCompare(before: Snapshot, after: Snapshot): string[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((key) => !shouldSkipKey(key))
    .sort();
}

export function isKnownAuditAction(action: string): action is AuditAction {
  return (Object.values(AUDIT_ACTIONS) as string[]).includes(action);
}

export function toAuditEventView(
  event: Pick<AuditEvent, "id" | "action" | "createdAt" | "actorUserId" | "before" | "after">,
  locale: AppLocale,
): AuditEventView {
  const before = canonicalize(asRecord(event.before));
  const after = canonicalize(asRecord(event.after));
  const created = isCreateSnapshot(before);
  const changes = compositeChanges(before, after, locale);

  for (const key of keysToCompare(before, after)) {
    if (!(key in before) && created && isNoisyCreateValue(key, after[key])) {
      continue;
    }
    if (valuesEqual(before[key], after[key])) {
      continue;
    }

    const beforeValue = key in before ? toValue(key, before[key]) : null;
    const afterValue = key in after ? toValue(key, after[key]) : null;
    if (!beforeValue && !afterValue) {
      continue;
    }

    changes.push({
      field: key,
      before: beforeValue,
      after: afterValue,
    });
  }

  const summary = changes.some((change) => change.field === "slot")
    ? null
    : slotLabel(after, locale) ?? slotLabel(before, locale);

  return {
    id: event.id,
    action: event.action,
    createdAt: event.createdAt,
    actorUserId: event.actorUserId,
    summary,
    changes,
  };
}

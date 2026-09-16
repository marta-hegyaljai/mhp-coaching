import type {PathnameHref} from "@/i18n/href";
import type {StatusTone} from "@/shared/ui/status-label";

/**
 * One operational channel on the control panel. Every admin-visible record in
 * the product normalizes into exactly one of these so the panel can present a
 * single chronological list instead of six separate screens.
 */
export const ACTIVITY_KINDS = [
  "registration",
  "reservation",
  "call",
  "message",
  "waitlist",
  "change",
] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

/** Which slice of time the panel is showing. */
export const ACTIVITY_WINDOWS = ["today", "upcoming", "history"] as const;

export type ActivityWindow = (typeof ACTIVITY_WINDOWS)[number];

/**
 * Enough to identify the underlying row for a row-level action. Keeping it a
 * discriminated union means a component can only reach for the fields the
 * matching channel actually has.
 */
export type ActivitySourceRef =
  | {kind: "registration"; bookingId: string}
  | {kind: "reservation"; bookingId: string}
  | {kind: "call"; callId: string}
  | {kind: "message"; messageId: string; channel: "course" | "contact"}
  | {kind: "waitlist"; entryId: string; courseId: string; notified: boolean}
  | {kind: "change"; eventId: string};

export type ActivityStatus = {
  label: string;
  tone: StatusTone;
};

export type ActivityEntry = {
  /** Unique across channels, so React keys never collide between sources. */
  id: string;
  kind: ActivityKind;
  /**
   * The moment the row is *about*: a course start day, a reservation start, a
   * call start, or — for rows that only ever arrive — the moment it arrived.
   */
  occursAt: Date;
  /** When the row landed in the system. Orders the history view. */
  receivedAt: Date;
  /** True when `occursAt` is a planned moment that can still be in the future. */
  scheduled: boolean;
  /** Rendered date/time of `occursAt`, already Zurich-local and localized. */
  when: {dateLabel: string; timeLabel: string | null};
  person: string | null;
  personDetail: string | null;
  title: string;
  detail: string | null;
  status: ActivityStatus | null;
  href: PathnameHref | null;
  source: ActivitySourceRef;
};

export type ActivityPage = {
  entries: ActivityEntry[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
};

/** Per-channel counts for the visible window, used by the channel filter. */
export type ActivityKindCounts = Record<ActivityKind, number>;

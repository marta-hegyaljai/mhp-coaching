import {
  ACTIVITY_KINDS,
  type ActivityKind,
  type ActivityKindCounts,
  type ActivityKindFilter,
} from "./types";

/** The records that describe the school’s day. The audit log is a side door. */
export const LIVE_ACTIVITY_KINDS = ACTIVITY_KINDS.filter(
  (kind): kind is Exclude<ActivityKind, "change"> => kind !== "change",
);

/**
 * The default board lists live activity. `all` therefore means “everything
 * that is happening”, not the 200-row access log that would bury it.
 */
export function isListedActivityKind(
  filter: ActivityKindFilter,
  kind: ActivityKind,
): boolean {
  if (filter === "all") {
    return kind !== "change";
  }

  return filter === kind;
}

export function listedActivityTotal(
  counts: ActivityKindCounts,
  filter: ActivityKindFilter,
): number {
  if (filter === "all") {
    return LIVE_ACTIVITY_KINDS.reduce((sum, kind) => sum + counts[kind], 0);
  }

  return counts[filter];
}

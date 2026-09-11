import type {AvailabilityState} from "@/features/rooms/availability";
import {minutesToTime, timeToMinutes} from "@/features/rooms/timezone";
import type {PathnameHref} from "@/i18n/href";

export type RunCell = {
  startTime: string;
  endTime: string;
  state: AvailabilityState;
  ownBookingId?: string;
  href?: PathnameHref;
  meta?: string;
  ariaLabel?: string;
};

export type SlotRun = RunCell & {
  /** Row index of the first slot, so the grid can span the rest. */
  startIndex: number;
  span: number;
};

/**
 * Contiguous slots that share a state collapse into one bar, the same way a
 * multi-day course session renders as one continuous named bar. A gap in the
 * time sequence always starts a new bar so nothing is silently bridged.
 */
export function mergeSlotRuns(cells: readonly RunCell[]): SlotRun[] {
  const runs: SlotRun[] = [];

  cells.forEach((cell, index) => {
    const open = runs.at(-1);

    if (
      open &&
      // Every available start is an independent calendar action. Merging them
      // made a long free period link only to its first time.
      !(cell.state === "available" && cell.href) &&
      open.state === cell.state &&
      open.endTime === cell.startTime &&
      open.ownBookingId === cell.ownBookingId &&
      open.meta === cell.meta
    ) {
      open.endTime = cell.endTime;
      open.span += 1;
      return;
    }

    runs.push({
      state: cell.state,
      startTime: cell.startTime,
      endTime: cell.endTime,
      ...(cell.ownBookingId ? {ownBookingId: cell.ownBookingId} : {}),
      ...(cell.href ? {href: cell.href} : {}),
      ...(cell.meta ? {meta: cell.meta} : {}),
      ...(cell.ariaLabel ? {ariaLabel: cell.ariaLabel} : {}),
      startIndex: index,
      span: 1,
    });
  });

  return runs;
}

type SlotLike = {
  localStart: string;
  localEnd: string;
  state: AvailabilityState;
  ownBookingId?: string;
  href?: PathnameHref;
  meta?: string;
  ariaLabel?: string;
};

/**
 * Builds one ordered cell per displayed time. A time with no slot is treated as
 * unavailable rather than dropped, so every column keeps the same row count.
 */
export function buildColumnCells(
  times: readonly string[],
  intervalMinutes: number,
  slotFor: (time: string) => SlotLike | undefined,
): RunCell[] {
  return times.map((startTime) => {
    const slot = slotFor(startTime);

    if (slot) {
      return {
        startTime,
        endTime: slot.localEnd,
        state: slot.state,
        ...(slot.ownBookingId ? {ownBookingId: slot.ownBookingId} : {}),
        ...(slot.href ? {href: slot.href} : {}),
        ...(slot.meta ? {meta: slot.meta} : {}),
        ...(slot.ariaLabel ? {ariaLabel: slot.ariaLabel} : {}),
      };
    }

    return {
      startTime,
      endTime: shiftTime(startTime, intervalMinutes),
      state: "unavailable",
    };
  });
}

function shiftTime(time: string, minutes: number): string {
  try {
    return minutesToTime(Math.min(timeToMinutes(time) + Math.max(minutes, 1), 1440));
  } catch {
    return time;
  }
}

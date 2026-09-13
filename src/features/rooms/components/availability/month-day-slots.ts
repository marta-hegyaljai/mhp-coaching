import type {AvailabilityState} from "@/features/rooms/availability";

import type {DragSlot} from "./drag-select";

export type MonthDaySlot = {
  roomId: string;
  localStart: string;
  localEnd: string;
  state: AvailabilityState;
  ownBookingId?: string;
};

function slotIsFree(slot: MonthDaySlot, exceptBookingId?: string): boolean {
  if (exceptBookingId && slot.ownBookingId === exceptBookingId) {
    return true;
  }
  return slot.state === "available";
}

/** One drag slot per clock time, with every room that can still take that start. */
export function dragSlotsForDay(input: {
  date: string;
  roomIds: string[];
  slots: MonthDaySlot[];
  exceptBookingId?: string;
}): DragSlot[] {
  const starts = [...new Set(input.slots.map((slot) => slot.localStart))].sort();

  return starts.map((start) => {
    const atTime = input.slots.filter((slot) => slot.localStart === start);
    const roomIds = input.roomIds.filter((roomId) =>
      atTime.some((slot) => slot.roomId === roomId && slotIsFree(slot, input.exceptBookingId)),
    );
    const end = atTime.find((slot) => slot.localEnd)?.localEnd ?? start;

    return {
      columnKey: input.date,
      date: input.date,
      start,
      end,
      roomIds,
      available: roomIds.length > 0,
    };
  });
}

export function firstBookableRange(
  slots: readonly DragSlot[],
  intervalMinutes: number,
  minimumBookingMinutes: number,
): {start: string; end: string; roomIds: string[]} | null {
  const required = Math.max(1, Math.ceil(minimumBookingMinutes / intervalMinutes));

  for (let index = 0; index <= slots.length - required; index += 1) {
    const slice = slots.slice(index, index + required);
    if (slice.some((slot) => !slot.available)) {
      continue;
    }
    if (slice.some((slot, offset) => offset > 0 && slot.start !== slice[offset - 1].end)) {
      continue;
    }

    let roomIds = slice[0].roomIds;
    for (const slot of slice) {
      roomIds = roomIds.filter((id) => slot.roomIds.includes(id));
    }
    if (roomIds.length === 0) {
      continue;
    }

    return {
      start: slice[0].start,
      end: slice[slice.length - 1].end,
      roomIds,
    };
  }

  return null;
}

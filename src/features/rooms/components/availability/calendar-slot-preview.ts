import {quoteRoomBooking, type RoomBookingQuote} from "@/features/rooms/pricing";
import type {BookableEnd} from "@/features/rooms/reservations";

import type {DragSlot} from "./drag-select";

export type CalendarSlotDraft = {
  start: string;
  end: string;
};

export type ResolvedCalendarSlot = {
  start: string;
  end: string;
  ends: BookableEnd[];
  quote: RoomBookingQuote | null;
  ready: boolean;
};

function durationMinutes(start: string, end: string): number {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

function slotAvailableForRoom(slot: DragSlot, roomId: string): boolean {
  return slot.available && slot.roomIds.includes(roomId);
}

function contiguousForRoom(
  slots: readonly DragSlot[],
  startIndex: number,
  endIndex: number,
  roomId: string,
): boolean {
  for (let index = startIndex; index <= endIndex; index += 1) {
    const slot = slots[index];
    if (!slot || !slotAvailableForRoom(slot, roomId)) {
      return false;
    }
    if (index > startIndex && slot.start !== slots[index - 1].end) {
      return false;
    }
  }
  return true;
}

/** Lists bookable start/end pairs for one room from the calendar column slots. */
export function buildCalendarSlotOptions(input: {
  slots: readonly DragSlot[];
  roomId: string;
  intervalMinutes: number;
  minimumBookingMinutes: number;
  maximumBookingMinutes: number | null;
  hourlyRateMinor: number;
  discountPercent: number;
}): {
  starts: string[];
  endsByStart: Record<string, BookableEnd[]>;
} {
  const {
    slots,
    roomId,
    minimumBookingMinutes,
    maximumBookingMinutes,
    hourlyRateMinor,
    discountPercent,
  } = input;
  const requiredSlots = Math.ceil(minimumBookingMinutes / input.intervalMinutes);
  const maxDuration = maximumBookingMinutes ?? 24 * 60;
  const starts: string[] = [];
  const endsByStart: Record<string, BookableEnd[]> = {};

  for (let startIndex = 0; startIndex <= slots.length - requiredSlots; startIndex += 1) {
    if (!contiguousForRoom(slots, startIndex, startIndex + requiredSlots - 1, roomId)) {
      continue;
    }

    const start = slots[startIndex].start;
    if (starts.includes(start)) {
      continue;
    }

    const ends: BookableEnd[] = [];
    for (let endIndex = startIndex + requiredSlots - 1; endIndex < slots.length; endIndex += 1) {
      if (!contiguousForRoom(slots, startIndex, endIndex, roomId)) {
        break;
      }

      const end = slots[endIndex].end;
      const duration = durationMinutes(start, end);
      if (duration > maxDuration) {
        break;
      }

      ends.push({
        time: end,
        durationMinutes: duration,
        quote: quoteRoomBooking({
          hourlyRateMinor,
          durationMinutes: duration,
          discountPercent,
        }),
      });
    }

    if (ends.length > 0) {
      starts.push(start);
      endsByStart[start] = ends;
    }
  }

  return {starts, endsByStart};
}

/** Rooms that stay free for the whole chosen interval on this day column. */
export function roomIdsForRange(
  slots: readonly DragSlot[],
  start: string,
  end: string,
): string[] {
  const startIndex = slots.findIndex((slot) => slot.start === start);
  if (startIndex < 0) {
    return [];
  }

  const slice: DragSlot[] = [];
  for (let index = startIndex; index < slots.length; index += 1) {
    slice.push(slots[index]);
    if (slots[index].end === end) {
      break;
    }
  }

  if (slice.length === 0 || slice.at(-1)?.end !== end || !slice.every((slot) => slot.available)) {
    return [];
  }

  for (let index = 1; index < slice.length; index += 1) {
    if (slice[index].start !== slice[index - 1].end) {
      return [];
    }
  }

  let roomIds = slice[0].roomIds;
  for (const slot of slice) {
    roomIds = roomIds.filter((id) => slot.roomIds.includes(id));
  }
  return roomIds;
}

/** Keeps the draft only while it still names a bookable slot for the room. */
export function resolveCalendarSlotDraft(
  draft: CalendarSlotDraft,
  options: {
    starts: string[];
    endsByStart: Record<string, BookableEnd[]>;
  } | null,
): ResolvedCalendarSlot {
  if (!options) {
    return {start: draft.start, end: draft.end, ends: [], quote: null, ready: false};
  }

  const start = options.starts.includes(draft.start)
    ? draft.start
    : (options.starts[0] ?? draft.start);
  const ends = options.endsByStart[start] ?? [];
  const selected = ends.find((item) => item.time === draft.end) ?? ends[0];

  return {
    start,
    end: selected?.time ?? "",
    ends,
    quote: selected?.quote ?? null,
    ready: Boolean(selected),
  };
}

export type DragSlot = {
  columnKey: string;
  date: string;
  start: string;
  end: string;
  roomIds: string[];
  available: boolean;
};

export type DragSelection = {
  columnKey: string;
  date: string;
  start: string;
  end: string;
  roomIds: string[];
  durationMinutes: number;
};

export type DragFailure =
  | "empty"
  | "gap"
  | "unavailable"
  | "too-short"
  | "too-long"
  | "no-room";

export type DragResult =
  | {ok: true; selection: DragSelection}
  | {ok: false; reason: DragFailure};

function durationMinutes(start: string, end: string): number {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

export function resolveDragSelection(input: {
  slots: readonly DragSlot[];
  columnKey: string;
  fromIndex: number;
  toIndex: number;
  intervalMinutes: number;
  minimumBookingMinutes: number;
  maximumBookingMinutes: number | null;
}): DragResult {
  if (input.slots.length === 0 || input.intervalMinutes <= 0) {
    return {ok: false, reason: "empty"};
  }

  const startIndex = Math.min(input.fromIndex, input.toIndex);
  const endIndex = Math.max(input.fromIndex, input.toIndex);
  if (startIndex < 0 || endIndex >= input.slots.length) {
    return {ok: false, reason: "empty"};
  }

  const slice = input.slots.slice(startIndex, endIndex + 1);
  if (slice.some((slot) => slot.columnKey !== input.columnKey)) {
    return {ok: false, reason: "unavailable"};
  }
  if (slice.some((slot) => !slot.available)) {
    return {ok: false, reason: "unavailable"};
  }

  for (let index = 1; index < slice.length; index += 1) {
    if (slice[index].start !== slice[index - 1].end || slice[index].date !== slice[0].date) {
      return {ok: false, reason: "gap"};
    }
  }

  const duration = durationMinutes(slice[0].start, slice[slice.length - 1].end);
  if (duration < input.minimumBookingMinutes) {
    return {ok: false, reason: "too-short"};
  }
  if (
    input.maximumBookingMinutes !== null &&
    duration > input.maximumBookingMinutes
  ) {
    return {ok: false, reason: "too-long"};
  }

  let roomIds = slice[0].roomIds;
  for (const slot of slice) {
    roomIds = roomIds.filter((id) => slot.roomIds.includes(id));
  }
  if (roomIds.length === 0) {
    return {ok: false, reason: "no-room"};
  }

  return {
    ok: true,
    selection: {
      columnKey: input.columnKey,
      date: slice[0].date,
      start: slice[0].start,
      end: slice[slice.length - 1].end,
      roomIds,
      durationMinutes: duration,
    },
  };
}

export function completeDragSelection(input: {
  slots: readonly DragSlot[];
  columnKey: string;
  fromIndex: number;
  toIndex: number;
  intervalMinutes: number;
  minimumBookingMinutes: number;
  maximumBookingMinutes: number | null;
}): DragResult {
  const raw = resolveDragSelection(input);
  if (raw.ok || raw.reason !== "too-short") {
    return raw;
  }

  const requiredSlots = Math.ceil(input.minimumBookingMinutes / input.intervalMinutes);
  const last = Math.max(input.fromIndex, input.toIndex);
  const first = Math.min(input.fromIndex, input.toIndex);
  const draggedForward = input.toIndex >= input.fromIndex;

  const attempts = draggedForward
    ? [
        {fromIndex: first, toIndex: first + requiredSlots - 1},
        {fromIndex: last - requiredSlots + 1, toIndex: last},
      ]
    : [
        {fromIndex: last - requiredSlots + 1, toIndex: last},
        {fromIndex: first, toIndex: first + requiredSlots - 1},
      ];

  for (const attempt of attempts) {
    const next = resolveDragSelection({...input, ...attempt});
    if (next.ok) {
      return next;
    }
  }

  return raw;
}

export function slotsFromColumn(input: {
  columnKey: string;
  cells: ReadonlyArray<{
    startTime: string;
    endTime: string;
    select?: {date: string; roomIds: string[]};
  }>;
}): DragSlot[] {
  return input.cells.map((cell) => ({
    columnKey: input.columnKey,
    date: cell.select?.date ?? "",
    start: cell.startTime,
    end: cell.endTime,
    roomIds: cell.select?.roomIds ?? [],
    available: Boolean(cell.select),
  }));
}

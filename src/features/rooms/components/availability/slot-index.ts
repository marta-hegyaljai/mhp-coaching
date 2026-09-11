import type {TherapistAvailabilitySlot} from "@/features/rooms/availability";

function key(roomId: string, date: string, time: string): string {
  return `${roomId}|${date}|${time}`;
}

export type SlotIndex = {
  /** Every displayed start time, ascending and shared by all columns. */
  times: string[];
  slotAt: (
    roomId: string,
    date: string,
    time: string,
  ) => TherapistAvailabilitySlot | undefined;
};

/** One pass over the payload so grid rendering never scans the slot list. */
export function indexSlots(slots: readonly TherapistAvailabilitySlot[]): SlotIndex {
  const byKey = new Map<string, TherapistAvailabilitySlot>();
  const times = new Set<string>();

  for (const slot of slots) {
    byKey.set(key(slot.roomId, slot.localDate, slot.localStart), slot);
    times.add(slot.localStart);
  }

  return {
    times: [...times].sort(),
    slotAt: (roomId, date, time) => byKey.get(key(roomId, date, time)),
  };
}

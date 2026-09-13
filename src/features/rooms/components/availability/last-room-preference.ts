const STORAGE_KEY = "mhp-room-booking-last-room";

/** Returns the therapist's last chosen room, if any. */
export function readLastRoomPreference(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Remembers the room chosen at confirmation for the next booking. */
export function writeLastRoomPreference(roomId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, roomId);
  } catch {
    // Storage may be blocked in private browsing; booking still proceeds.
  }
}

/** Keeps the current room when possible, otherwise the last saved preference. */
export function pickPreferredRoomId(
  availableRoomIds: readonly string[],
  currentRoomId?: string,
): string | undefined {
  if (availableRoomIds.length === 0) {
    return currentRoomId || undefined;
  }
  if (currentRoomId && availableRoomIds.includes(currentRoomId)) {
    return currentRoomId;
  }
  const last = readLastRoomPreference();
  if (last && availableRoomIds.includes(last)) {
    return last;
  }
  return availableRoomIds[0];
}

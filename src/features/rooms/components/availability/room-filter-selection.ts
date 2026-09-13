/** Computes the next URL room filter after a chip interaction. */
export function nextRoomFilterSelection(input: {
  allRoomIds: readonly string[];
  selectedRoomIds: readonly string[];
  roomId: string;
  checked: boolean;
}): string[] {
  const allSelected = input.selectedRoomIds.length === 0;

  if (input.checked && allSelected) {
    return [];
  }

  if (!input.checked && allSelected) {
    return input.allRoomIds.filter((id) => id !== input.roomId);
  }

  if (input.checked) {
    const next = [...input.selectedRoomIds, input.roomId];
    return next.length === input.allRoomIds.length ? [] : next;
  }

  return input.selectedRoomIds.filter((id) => id !== input.roomId);
}

/** Empty room ids mean every active room is included. */
export function allRoomsSelected(
  allRoomIds: readonly string[],
  selectedRoomIds: readonly string[],
): boolean {
  return selectedRoomIds.length === 0;
}

/** Shows every room chip as selected when the filter includes all rooms. */
export function effectiveRoomSelection(
  allRoomIds: readonly string[],
  selectedRoomIds: readonly string[],
): Set<string> {
  if (allRoomsSelected(allRoomIds, selectedRoomIds)) {
    return new Set(allRoomIds);
  }
  return new Set(selectedRoomIds);
}

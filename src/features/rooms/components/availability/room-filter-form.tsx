"use client";

import {useTransition} from "react";

import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import type {AvailabilityRoom} from "@/features/rooms/availability";
import {availabilityHref, type AvailabilityQuery} from "@/features/rooms/query";
import {useRouter} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";

import {writeLastRoomPreference} from "./last-room-preference";
import {
  allRoomsSelected,
  effectiveRoomSelection,
  nextRoomFilterSelection,
} from "./room-filter-selection";

const chipClass =
  "flex min-h-12 cursor-pointer items-center justify-between gap-2 rounded-panel border border-ink bg-white px-3 py-2 text-left text-ink transition-colors duration-150 ease-standard hover:bg-hover has-[:checked]:bg-ink has-[:checked]:text-parchment focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink";

/** Applies the room filter immediately as chips are toggled. */
export function RoomFilterForm({
  locale,
  query,
  rooms,
  selectedRoomIds,
  labels,
}: {
  locale: AppLocale;
  query: AvailabilityQuery;
  rooms: AvailabilityRoom[];
  selectedRoomIds: string[];
  labels: {
    filterRooms: string;
    allRooms: string;
    perHour: string;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const allRoomIds = rooms.map((room) => room.id);
  const allSelected = allRoomsSelected(allRoomIds, selectedRoomIds);
  const effectiveSelected = effectiveRoomSelection(allRoomIds, selectedRoomIds);

  function applyRoomIds(roomIds: string[]) {
    startTransition(() => {
      router.push(availabilityHref({...query, roomIds}), {scroll: false});
    });
  }

  function selectAllRooms() {
    if (allSelected) {
      return;
    }
    applyRoomIds([]);
  }

  function toggleRoom(roomId: string, checked: boolean) {
    if (checked) {
      writeLastRoomPreference(roomId);
    }
    applyRoomIds(
      nextRoomFilterSelection({
        allRoomIds,
        selectedRoomIds,
        roomId,
        checked,
      }),
    );
  }

  return (
    <fieldset className={pending ? "opacity-70" : undefined} disabled={pending}>
      <legend className="sr-only">{labels.filterRooms}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <button
          type="button"
          aria-current={allSelected ? "true" : undefined}
          onClick={selectAllRooms}
          className={`flex min-h-12 items-center justify-between gap-2 rounded-panel border px-3 py-2 text-left transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
            allSelected
              ? "border-ink bg-ink text-parchment"
              : "border-ink bg-white text-ink hover:bg-hover"
          }`}
        >
          <span className="text-sm font-semibold">{labels.allRooms}</span>
        </button>

        {rooms.map((room) => {
          const checked = effectiveSelected.has(room.id);

          return (
            <label key={room.id} className={chipClass}>
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => toggleRoom(room.id, event.target.checked)}
                className="h-4 w-4 shrink-0 cursor-pointer accent-white"
              />
              <span className="min-w-0 flex-1 text-sm font-semibold leading-tight">
                {room.name}
              </span>
              <span className="font-sans text-xs font-semibold tabular-nums leading-none">
                {formatChf(minorUnitsToFrancs(room.hourlyRateMinor), locale)}
                {labels.perHour}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

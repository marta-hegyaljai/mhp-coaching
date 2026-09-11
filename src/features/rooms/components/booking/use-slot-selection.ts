"use client";

import {useState} from "react";

import type {ReservationPreview} from "@/features/rooms/reservations";
import {
  emptySlotDraft,
  resolveSlotSelection,
  type ResolvedSlot,
  type SlotDraft,
} from "@/features/rooms/slot-selection";

export type SlotSelection = ResolvedSlot & {
  selectStart: (time: string) => void;
  selectEnd: (time: string) => void;
};

/** Holds the browser-side slot draft and resolves it against the preview. */
export function useSlotSelection(preview: ReservationPreview | null): SlotSelection {
  const [draft, setDraft] = useState<SlotDraft>(emptySlotDraft);
  const resolved = resolveSlotSelection(preview, draft);

  return {
    ...resolved,
    // A new start invalidates the end, which the resolver then re-defaults.
    selectStart: (time) => setDraft({start: time, end: ""}),
    selectEnd: (time) => setDraft({start: resolved.start, end: time}),
  };
}

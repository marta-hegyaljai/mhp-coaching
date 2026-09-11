import type {RoomBookingQuote} from "@/features/rooms/pricing";
import type {BookableEnd, ReservationPreview} from "@/features/rooms/reservations";

export type SlotDraft = {
  start: string;
  end: string;
};

export type ResolvedSlot = {
  start: string;
  end: string;
  ends: BookableEnd[];
  quote: RoomBookingQuote | null;
  /** False while no end time is bookable, which must block the submit. */
  ready: boolean;
};

export const emptySlotDraft: SlotDraft = {start: "", end: ""};

/**
 * Start and end are chosen in the browser while room and date round-trip to
 * the server, so a mounted form can receive a preview that no longer contains
 * the draft. A draft is therefore honoured only while it still names a
 * bookable slot; otherwise the server's own default wins.
 */
export function resolveSlotSelection(
  preview: ReservationPreview | null,
  draft: SlotDraft,
): ResolvedSlot {
  if (!preview) {
    return {start: "", end: "", ends: [], quote: null, ready: false};
  }

  const start = preview.starts.includes(draft.start) ? draft.start : preview.start;
  const ends = preview.endsByStart[start] ?? preview.ends;
  const selected =
    ends.find((item) => item.time === draft.end) ??
    ends.find((item) => item.time === preview.end) ??
    ends[0];

  return {
    start,
    end: selected?.time ?? "",
    ends,
    quote: selected?.quote ?? preview.quote,
    ready: Boolean(selected),
  };
}

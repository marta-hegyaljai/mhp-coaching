import type {AvailabilityState} from "@/features/rooms/availability";

export type SlotLabels = Record<AvailabilityState, string>;

/**
 * States differ by border, fill and pattern as well as by their written label,
 * so the calendar stays readable without relying on colour.
 */
export const slotSurface: Record<AvailabilityState, string> = {
  available: "border-ink bg-white text-ink",
  booked:
    "border-ink text-ink [background-image:repeating-linear-gradient(-45deg,#ffffff_0_5px,#d5d5d1_5px_8px)]",
  unavailable: "border-line bg-shell text-ink-subtle",
  "my-booking": "border-ink bg-ink text-parchment",
};

export const slotMetaText: Record<AvailabilityState, string> = {
  available: "text-ink-muted group-hover:text-parchment",
  booked: "text-ink-muted",
  unavailable: "text-ink-subtle",
  "my-booking": "text-parchment group-hover:text-ink",
};

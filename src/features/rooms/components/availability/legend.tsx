import type {AvailabilityState} from "@/features/rooms/availability";

import {slotSurface, type SlotLabels} from "./slot-styles";

const order: AvailabilityState[] = ["available", "booked", "my-booking", "unavailable"];

export function AvailabilityLegend({
  labels,
  className = "",
}: {
  labels: SlotLabels;
  className?: string;
}) {
  return (
    <ul
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink-muted ${className}`}
    >
      {order.map((state) => (
        <li key={state} className="inline-flex items-center gap-2">
          <span aria-hidden className={`h-3 w-5 border ${slotSurface[state]}`} />
          {labels[state]}
        </li>
      ))}
    </ul>
  );
}

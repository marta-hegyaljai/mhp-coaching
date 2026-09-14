"use client";

import {useCallback, useSyncExternalStore} from "react";

import {
  readBookingsLayout,
  writeBookingsLayout,
  type BookingsLayout,
} from "@/features/rooms/components/booking-list/layout";

const itemClass =
  "inline-flex min-h-11 items-center px-4 text-xs font-semibold uppercase tracking-[0.1em] transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function eventName(storageKey: string): string {
  return `${storageKey}-change`;
}

export function BookingsLayoutSwitch({
  label,
  tableLabel,
  cardsLabel,
  value,
  onChange,
}: {
  label: string;
  tableLabel: string;
  cardsLabel: string;
  value: BookingsLayout;
  onChange: (layout: BookingsLayout) => void;
}) {
  return (
    <div role="group" aria-label={label} className="hidden rounded-panel border border-ink lg:inline-flex">
      <button
        type="button"
        aria-pressed={value === "table"}
        onClick={() => onChange("table")}
        className={`${itemClass} ${value === "table" ? "bg-ink text-parchment" : "bg-white text-ink hover:bg-hover"}`}
      >
        {tableLabel}
      </button>
      <button
        type="button"
        aria-pressed={value === "cards"}
        onClick={() => onChange("cards")}
        className={`${itemClass} border-l border-ink ${
          value === "cards" ? "bg-ink text-parchment" : "bg-white text-ink hover:bg-hover"
        }`}
      >
        {cardsLabel}
      </button>
    </div>
  );
}

export function useBookingsLayout(
  storageKey: string,
): [BookingsLayout, (layout: BookingsLayout) => void] {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const name = eventName(storageKey);
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(name, onStoreChange);
      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(name, onStoreChange);
      };
    },
    [storageKey],
  );
  const getSnapshot = useCallback(() => readBookingsLayout(storageKey), [storageKey]);
  const layout = useSyncExternalStore(subscribe, getSnapshot, () => "table" as const);
  const choose = useCallback(
    (next: BookingsLayout) => {
      writeBookingsLayout(storageKey, next);
      window.dispatchEvent(new Event(eventName(storageKey)));
    },
    [storageKey],
  );
  return [layout, choose];
}

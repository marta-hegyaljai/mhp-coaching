"use client";

import {useCallback, useSyncExternalStore} from "react";

import {
  readAdminBookingsLayout,
  writeAdminBookingsLayout,
  type AdminBookingsLayout,
} from "@/features/rooms/components/admin/bookings/layout-preference";

const LAYOUT_EVENT = "mhp-admin-bookings-layout";

const itemClass =
  "inline-flex min-h-11 items-center px-4 text-xs font-semibold uppercase tracking-[0.1em] transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LAYOUT_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LAYOUT_EVENT, onStoreChange);
  };
}

function getSnapshot(): AdminBookingsLayout {
  return readAdminBookingsLayout();
}

function getServerSnapshot(): AdminBookingsLayout {
  return "table";
}

export function AdminBookingsLayoutSwitch({
  label,
  tableLabel,
  cardsLabel,
  value,
  onChange,
}: {
  label: string;
  tableLabel: string;
  cardsLabel: string;
  value: AdminBookingsLayout;
  onChange: (layout: AdminBookingsLayout) => void;
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

export function useAdminBookingsLayout(): [AdminBookingsLayout, (layout: AdminBookingsLayout) => void] {
  const layout = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const choose = useCallback((next: AdminBookingsLayout) => {
    writeAdminBookingsLayout(next);
    window.dispatchEvent(new Event(LAYOUT_EVENT));
  }, []);
  return [layout, choose];
}

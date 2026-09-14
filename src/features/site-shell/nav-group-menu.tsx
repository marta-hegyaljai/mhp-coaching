"use client";

import {useEffect, useId, useRef, useState, type ReactNode} from "react";

import {usePathname} from "@/i18n/navigation";
import {ChevronDownIcon} from "@/shared/ui/icons";

import {navChipClass, navChipCurrentClass} from "./nav-chip";
import {isCurrentPath} from "./nav-path";

/**
 * One header chip that discloses the secondary destinations, so the bar keeps
 * only the course list and the booking action. It is a disclosure, not a hover
 * menu: it opens on click, closes on Escape, on an outside pointer and on any
 * completed navigation.
 */
export function NavGroupMenu({
  label,
  matches,
  children,
}: {
  label: string;
  /** Route prefixes owned by the group; any of them marks the chip. */
  matches: string[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  // Remembering where the panel was opened closes it on any completed
  // navigation, even a click on the route the visitor is already reading.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const isOpen = openedOn === pathname;
  const isCurrentSection = matches.some((match) => isCurrentPath(pathname, match));

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenedOn(null);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenedOn(null);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        aria-current={isCurrentSection ? "true" : undefined}
        onClick={() => setOpenedOn(isOpen ? null : pathname)}
        className={isCurrentSection || isOpen ? navChipCurrentClass : navChipClass}
      >
        {label}
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <ul
          id={panelId}
          // Same-route links fire no navigation, so closing is delegated here.
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) {
              setOpenedOn(null);
            }
          }}
          className="absolute top-[calc(100%+0.5rem)] left-0 z-50 w-72 rounded-panel border border-ink bg-white p-1"
        >
          {children}
        </ul>
      ) : null}
    </div>
  );
}

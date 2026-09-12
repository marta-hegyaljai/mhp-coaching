"use client";

import {useEffect, useId, useRef, useState, type ReactNode} from "react";

import {usePathname} from "@/i18n/navigation";
import {CloseIcon, MenuIcon} from "@/shared/ui/icons";

/**
 * Phone and tablet navigation. The panel fills the screen below the header so
 * the product reads like an installed app, while the header keeps the primary
 * call to action outside the menu where it stays one tap away.
 */
export function MobileMenu({
  openLabel,
  closeLabel,
  children,
}: {
  openLabel: string;
  closeLabel: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  // Remembering where the sheet was opened closes it on any completed
  // navigation without an extra render pass.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const isOpen = openedOn === pathname;

  function close() {
    setOpenedOn(null);
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenedOn(null);
        triggerRef.current?.focus();
      }
    }

    // Widening past `lg` swaps in the desktop header, so the sheet must let go
    // of the page instead of leaving it locked behind a hidden panel.
    const desktop = window.matchMedia("(min-width: 64rem)");
    function closeOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) {
        setOpenedOn(null);
      }
    }

    // The sheet owns the viewport while it is open; the page must not scroll
    // underneath it. The previous inline value is restored on close.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus({preventScroll: true});
    document.addEventListener("keydown", closeOnEscape);
    desktop.addEventListener("change", closeOnDesktop);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={isOpen ? closeLabel : openLabel}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        onClick={() => setOpenedOn(isOpen ? null : pathname)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-panel border border-ink bg-white text-ink transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink lg:hidden"
      >
        {isOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          id={panelId}
          tabIndex={-1}
          // Same-route links fire no navigation, so closing is delegated here.
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a, button[type='submit']")) {
              close();
            }
          }}
          className="absolute inset-x-0 top-full z-50 flex h-[calc(100dvh-var(--mhp-header-height))] flex-col overflow-y-auto overscroll-contain bg-ivory focus:outline-none lg:hidden"
        >
          {children}
        </div>
      ) : null}
    </>
  );
}

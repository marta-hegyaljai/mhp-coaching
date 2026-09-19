"use client";

import {useEffect, useId, useRef, useState} from "react";
import {useTranslations} from "next-intl";

import {usePathname} from "@/i18n/navigation";
import {ChevronDownIcon} from "@/shared/ui/icons";

import type {WorkspaceNavModel} from "./workspace-nav";
import {workspaceCurrentLabel} from "./workspace-nav";
import {WorkspaceNavList} from "./workspace-nav-list";

/**
 * Phone section switcher. The product header keeps the booking action; this
 * bar only names the current workspace destination and opens a sheet of the
 * rest. Escape, a completed navigation, or the same button closes it.
 */
export function WorkspaceNavMobile({nav}: {nav: WorkspaceNavModel}) {
  const pathname = usePathname();
  const t = useTranslations("Nav");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const isOpen = openedOn === pathname;
  const current = workspaceCurrentLabel(nav);

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

    const desktop = window.matchMedia("(min-width: 64rem)");
    function closeOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) {
        setOpenedOn(null);
      }
    }

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
    <div className="sticky top-[var(--mhp-header-height)] z-[35] shrink-0 border-b border-line bg-white lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        aria-label={`${nav.eyebrow}: ${current}`}
        onClick={() => setOpenedOn(isOpen ? null : pathname)}
        className="flex h-11 w-full items-center justify-between gap-3 px-3 text-left transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
      >
        <span className="min-w-0 truncate">
          <span className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.16em] text-gold-deep">
            {nav.eyebrow}
          </span>
          <span className="text-ink-muted"> · </span>
          <span className="text-sm font-semibold text-ink">{current}</span>
        </span>
        <ChevronDownIcon
          className={`text-ink transition-transform duration-150 ease-standard ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label={t("workspaceClose")}
            onClick={close}
            className="fixed inset-x-0 bottom-0 top-[var(--mhp-workspace-sheet-top)] z-20 bg-ink/20 lg:hidden"
          />
          <div
            ref={panelRef}
            id={panelId}
            tabIndex={-1}
            className="fixed inset-x-0 top-[var(--mhp-workspace-sheet-top)] z-30 flex max-h-[min(28rem,calc(100dvh-var(--mhp-workspace-sheet-top)))] flex-col overflow-y-auto overscroll-contain border-b border-ink bg-white focus:outline-none lg:hidden"
          >
            <p className="sr-only">{t("workspaceMenu")}</p>
            <WorkspaceNavList nav={nav} onNavigate={close} />
          </div>
        </>
      ) : null}
    </div>
  );
}

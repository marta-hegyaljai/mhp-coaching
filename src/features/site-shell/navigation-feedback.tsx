"use client";

import {useSearchParams} from "next/navigation";
import {useEffect, useState} from "react";

import {usePathname} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {SpinnerIcon} from "@/shared/ui/icons";

const loadingLabel: Record<AppLocale, string> = {
  fr: "Chargement…",
  de: "Wird geladen…",
  en: "Loading…",
};

/**
 * Immediate feedback for server-rendered route transitions. The current page
 * remains usable while Next fetches the next RSC payload, so users never have
 * to guess whether their click registered.
 */
export function NavigationFeedback({locale}: {locale: AppLocale}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const currentLocation = `${pathname}?${search}`;
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const pending = pendingFrom === currentLocation;

  useEffect(() => {
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    function begin() {
      setPendingFrom(currentLocation);
      clearTimeout(fallbackTimer);
      // A failed or cancelled navigation must not leave permanent busy UI.
      fallbackTimer = setTimeout(() => setPendingFrom(null), 15_000);
    }

    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      const anchor = target instanceof Element ? target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const destination = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      const sameDocument =
        destination.origin === current.origin &&
        destination.pathname === current.pathname &&
        destination.search === current.search;

      if (destination.origin === current.origin && !sameDocument) {
        begin();
      }
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", begin);

    return () => {
      clearTimeout(fallbackTimer);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", begin);
    };
  }, [currentLocation]);

  if (!pending) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-[4.25rem] right-3 z-[70] inline-flex min-h-10 items-center gap-2 rounded-panel border border-ink bg-ink px-3 text-xs font-semibold uppercase tracking-[0.1em] text-parchment sm:top-[4.75rem]"
    >
      <SpinnerIcon />
      {loadingLabel[locale]}
    </div>
  );
}

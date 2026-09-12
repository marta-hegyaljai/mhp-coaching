"use client";

import {useTranslations} from "next-intl";
import {useEffect, useRef, useState} from "react";

import {signOutAction} from "@/features/auth/actions";
import type {Viewer} from "@/features/auth/require";
import {Link, usePathname} from "@/i18n/navigation";

export function AccountMenu({
  locale,
  viewer,
}: {
  locale: string;
  viewer: Viewer;
}) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const displayName = `${viewer.firstName} ${viewer.lastName}`.trim() || viewer.email;
  const current =
    pathname === "/account" || pathname.startsWith("/account/");

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={t("accountMenu")}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-current={current ? "page" : undefined}
        onClick={() => setIsOpen((open) => !open)}
        className={`inline-flex h-14 max-w-[9.5rem] items-center gap-2 px-2 text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-ink transition-opacity duration-150 hover:opacity-60 sm:h-16 sm:max-w-[12rem] sm:px-2.5 sm:text-xs sm:tracking-[0.1em] ${
          current ? "shadow-[inset_0_-2px_0_0_currentColor]" : ""
        }`}
      >
        <span className="truncate">{displayName}</span>
        <span
          aria-hidden="true"
          className={`h-2 w-2 shrink-0 border-r border-b border-ink transition-transform duration-150 ${
            isOpen ? "-translate-y-0.5 rotate-[225deg]" : "-translate-y-0.5 rotate-45"
          }`}
        />
      </button>
      {isOpen ? (
        <div
          role="menu"
          aria-label={t("accountMenu")}
          className="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-56 rounded-panel border border-ink bg-white p-1"
        >
          <p className="truncate px-3 py-2 text-xs leading-5 text-ink-muted">{viewer.email}</p>
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex min-h-11 items-center px-3 text-sm text-ink hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
          >
            {t("account")}
          </Link>
          <Link
            href="/account/courses"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex min-h-11 items-center px-3 text-sm text-ink hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
          >
            {t("myCourses")}
          </Link>
          <form action={signOutAction.bind(null, locale)}>
            <button
              type="submit"
              role="menuitem"
              className="flex min-h-11 w-full items-center px-3 text-left text-sm text-ink hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
            >
              {t("signOut")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

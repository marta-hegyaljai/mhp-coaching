"use client";

import {useTranslations} from "next-intl";
import {useEffect, useId, useRef, useState} from "react";

import {signOutAction} from "@/features/auth/actions";
import type {Viewer} from "@/features/auth/require";
import {Link, usePathname} from "@/i18n/navigation";
import {ChevronDownIcon} from "@/shared/ui/icons";

import {displayName, personInitials} from "./identity";
import {accountNavEntries} from "./nav-model";
import {isCurrentPath} from "./nav-path";

const menuItem =
  "flex min-h-11 items-center rounded-panel px-3 text-sm text-ink transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink";

/**
 * Desktop account control. It is deliberately not a navigation chip: the
 * bordered trigger and monogram separate "who is signed in" from "where the
 * pages are".
 */
export function AccountMenu({locale, viewer}: {locale: string; viewer: Viewer}) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  // Tracking where the menu was opened closes it on any completed navigation.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const isOpen = openedOn === pathname;
  const name = displayName(viewer);
  const inAccount = accountNavEntries.some((entry) =>
    isCurrentPath(pathname, entry.match, entry.exact),
  );

  useEffect(() => {
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
  }, []);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={t("accountMenu")}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setOpenedOn(isOpen ? null : pathname)}
        className={`flex h-11 max-w-[13rem] items-center gap-2 rounded-panel border bg-white py-1 pr-2 pl-1 transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
          isOpen || inAccount ? "border-ink" : "border-line-soft"
        }`}
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-panel bg-ink text-[0.7rem] font-bold tracking-[0.04em] text-parchment"
        >
          {personInitials(viewer)}
        </span>
        <span className="hidden max-w-[8rem] truncate text-sm font-semibold text-ink xl:block">
          {name}
        </span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 text-ink-muted transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          aria-label={t("accountMenu")}
          className="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-64 rounded-panel border border-ink bg-white"
        >
          <div className="border-b border-line-soft px-3 py-3">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="truncate text-xs leading-5 text-ink-muted">{viewer.email}</p>
          </div>
          <div className="p-1">
            {accountNavEntries.map((entry) => (
              <Link
                key={entry.key}
                href={entry.href}
                role="menuitem"
                aria-current={
                  isCurrentPath(pathname, entry.match, entry.exact) ? "page" : undefined
                }
                onClick={() => setOpenedOn(null)}
                className={`${menuItem} aria-[current=page]:font-semibold`}
              >
                {t(entry.key)}
              </Link>
            ))}
          </div>
          <form
            action={signOutAction.bind(null, locale)}
            className="border-t border-line-soft p-1"
          >
            <button type="submit" role="menuitem" className={`${menuItem} w-full text-left`}>
              {t("signOut")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

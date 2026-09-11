"use client";

import {useLocale, useTranslations} from "next-intl";
import {useEffect, useRef, useState, useTransition} from "react";

import type {PathnameHref} from "@/i18n/href";
import {usePathname, useRouter} from "@/i18n/navigation";
import {routing, type AppLocale} from "@/i18n/routing";
import {SpinnerIcon} from "@/shared/ui/icons";

const languageNames: Record<AppLocale, string> = {
  fr: "Français",
  de: "Deutsch",
  en: "English",
};

export function LanguageSwitcher({
  hreflangs,
}: {
  hreflangs?: Partial<Record<AppLocale, PathnameHref>>;
}) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("LanguageSwitcher");
  const pathname = usePathname();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  function changeLocale(nextLocale: AppLocale) {
    setIsOpen(false);

    if (nextLocale === locale) {
      return;
    }

    startTransition(() => {
      const href = hreflangs?.[nextLocale] ?? pathname;
      router.replace(href as Parameters<typeof router.replace>[0], {
        locale: nextLocale,
      });
    });
  }

  return (
    <div ref={rootRef} className="relative w-[5.25rem] shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={t("label")}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={isPending}
        onClick={() => setIsOpen((open) => !open)}
        className={`group/language flex h-11 w-full items-center justify-between rounded-full border bg-shell px-3 text-xs font-bold uppercase tracking-[0.14em] text-ink transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-progress disabled:opacity-55 ${
          isOpen ? "border-ink" : "border-line-soft"
        }`}
      >
        <span>{locale}</span>
        {isPending ? (
          <SpinnerIcon />
        ) : (
          <span
            aria-hidden="true"
            className={`h-2 w-2 border-r border-b border-ink transition-transform duration-150 ${
              isOpen ? "-translate-y-0.5 rotate-[225deg]" : "-translate-y-0.5 rotate-45"
            }`}
          />
        )}
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label={t("label")}
          className="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-44 rounded-panel border border-ink bg-parchment p-1"
        >
          {routing.locales.map((availableLocale) => {
            const isCurrent = availableLocale === locale;

            return (
              <button
                key={availableLocale}
                type="button"
                role="menuitemradio"
                aria-checked={isCurrent}
                lang={availableLocale}
                onClick={() => changeLocale(availableLocale)}
                className={`flex min-h-11 w-full items-center justify-between px-3 text-left text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink ${
                  isCurrent
                    ? "bg-ink text-parchment"
                    : "text-ink hover:bg-hover"
                }`}
              >
                <span>{languageNames[availableLocale]}</span>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] opacity-65">
                  {availableLocale}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

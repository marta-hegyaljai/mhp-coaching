"use client";

import {useLocale, useTranslations} from "next-intl";
import {useTransition} from "react";

import type {PathnameHref} from "@/i18n/href";
import {usePathname, useRouter} from "@/i18n/navigation";
import {routing, type AppLocale} from "@/i18n/routing";

export function LanguageSwitcher({
  hreflangs,
}: {
  hreflangs?: Partial<Record<AppLocale, PathnameHref>>;
}) {
  const locale = useLocale();
  const t = useTranslations("LanguageSwitcher");
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function changeLocale(nextLocale: AppLocale) {
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
    <div
      role="group"
      aria-label={t("label")}
      className="flex items-center gap-0.5 rounded-full border border-line bg-parchment p-0.5"
    >
      {routing.locales.map((availableLocale) => {
        const isActive = availableLocale === locale;

        return (
          <button
            key={availableLocale}
            type="button"
            lang={availableLocale}
            aria-current={isActive ? "true" : undefined}
            disabled={isPending}
            onClick={() => changeLocale(availableLocale)}
            className={`min-h-11 min-w-11 rounded-full px-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] transition duration-200 ease-standard active:scale-95 disabled:cursor-progress ${
              isActive
                ? "bg-ink text-ivory"
                : "text-ink-subtle hover:bg-shell hover:text-ink"
            }`}
          >
            {availableLocale}
          </button>
        );
      })}
    </div>
  );
}

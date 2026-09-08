"use client";

import {useLocale, useTranslations} from "next-intl";
import {useTransition} from "react";

import {usePathname, useRouter} from "@/i18n/navigation";
import {routing, type AppLocale} from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("LanguageSwitcher");
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function changeLocale(nextLocale: AppLocale) {
    startTransition(() => {
      router.replace(pathname, {locale: nextLocale});
    });
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{t("label")}</span>
      <select
        aria-label={t("label")}
        className="min-h-11 cursor-pointer border border-stone-400 bg-transparent px-3 uppercase tracking-wider disabled:opacity-60"
        disabled={isPending}
        onChange={(event) => changeLocale(event.target.value as AppLocale)}
        value={locale}
      >
        {routing.locales.map((availableLocale) => (
          <option key={availableLocale} value={availableLocale}>
            {availableLocale}
          </option>
        ))}
      </select>
    </label>
  );
}

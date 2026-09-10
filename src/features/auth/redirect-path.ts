import type {AppLocale} from "@/i18n/routing";
import {routing} from "@/i18n/routing";

const localePrefix = new RegExp(
  `^/(${routing.locales.join("|")})(/|$)`,
);

export function safeInternalPath(
  value: string | null | undefined,
  locale: AppLocale,
): string {
  const fallback = `/${locale}`;

  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();

  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.includes("://") ||
    !localePrefix.test(trimmed)
  ) {
    return fallback;
  }

  return trimmed;
}

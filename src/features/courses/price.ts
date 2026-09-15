import {formatChf} from "@/features/payments/money";
import type {AppLocale} from "@/i18n/routing";

import {isComplimentaryCourse} from "./types";

const FREE_LABEL: Record<AppLocale, string> = {
  fr: "Gratuit",
  de: "Kostenlos",
  en: "Free",
};

/** Catalogue prices: whole francs, or the localized free label at CHF 0. */
export function formatCataloguePrice(
  priceChf: number,
  locale: AppLocale,
): string {
  if (isComplimentaryCourse({priceChf})) {
    return FREE_LABEL[locale];
  }

  return formatChf(priceChf, locale, {compact: true});
}

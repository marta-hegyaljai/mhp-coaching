import type {AppLocale} from "@/i18n/routing";

/** Swiss regional tags keep dates, numbers and weekday names locally correct. */
export function intlLocale(locale: AppLocale): string {
  if (locale === "en") {
    return "en-GB";
  }

  if (locale === "de") {
    return "de-CH";
  }

  return "fr-CH";
}

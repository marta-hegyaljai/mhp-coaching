export function francsToMinorUnits(amountChf: number): number {
  if (!Number.isFinite(amountChf) || amountChf < 0) {
    throw new Error("Invalid amount");
  }

  return Math.round(amountChf * 100);
}

export function formatChf(
  amountChf: number,
  locale: string,
  // Course prices are whole francs; `compact` drops the ".00" where the extra
  // precision only adds visual noise (headings, cards, action bars).
  options: {compact?: boolean} = {},
): string {
  const intlLocale = locale === "en" ? "de-CH" : locale === "de" ? "de-CH" : "fr-CH";
  const fractionDigits =
    options.compact && Number.isInteger(amountChf) ? 0 : 2;

  const parts = new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: "CHF",
    currencyDisplay: "code",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).formatToParts(amountChf);

  // Node and browsers can ship different CLDR revisions for de-CH (ASCII
  // apostrophe vs typographic apostrophe). Normalize the group separator so a
  // client-rendered booking form always hydrates the server markup exactly.
  return parts
    .map((part) => (part.type === "group" ? "’" : part.value))
    .join("");
}

export function minorUnitsToFrancs(amountMinor: number): number {
  return amountMinor / 100;
}

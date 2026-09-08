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

  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: "CHF",
    currencyDisplay: "code",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amountChf);
}

export function minorUnitsToFrancs(amountMinor: number): number {
  return amountMinor / 100;
}

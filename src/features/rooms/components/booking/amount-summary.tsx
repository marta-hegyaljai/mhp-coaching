"use client";

import {useTranslations} from "next-intl";

import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import type {AppLocale} from "@/i18n/routing";
import {PanelDivider} from "@/shared/ui/panel";
import {Price} from "@/shared/ui/price";
import {SectionLabel} from "@/shared/ui/section-label";

/**
 * Every screen that commits or reviews money shows the same block: how the
 * figure was derived, the discount, the amount, then how it is billed.
 */
export function AmountSummary({
  locale,
  durationMinutes,
  rateMinor,
  amountMinor,
  chargeableMinor,
  discountPercent = 0,
  outcomeNote,
  showBillingNote = false,
}: {
  locale: AppLocale;
  durationMinutes: number;
  rateMinor: number;
  amountMinor: number;
  /** The figure actually owed; defaults to the calculated amount. */
  chargeableMinor?: number;
  discountPercent?: number;
  outcomeNote?: string;
  showBillingNote?: boolean;
}) {
  const t = useTranslations("Rooms");
  const rate = formatChf(minorUnitsToFrancs(rateMinor), locale);
  const amount = formatChf(minorUnitsToFrancs(amountMinor), locale);
  const chargeable = chargeableMinor ?? amountMinor;

  return (
    <div>
      <SectionLabel>{t("bookAmount")}</SectionLabel>
      <p className="mt-3 font-sans text-sm leading-6 tabular-nums text-ink-muted">
        {t("bookCalculation", {minutes: durationMinutes, rate, amount})}
      </p>
      {discountPercent > 0 ? (
        <p className="mt-1 text-sm leading-6 text-ink-muted">
          {t("bookDiscount", {percent: discountPercent})}
        </p>
      ) : null}
      <p className="mt-4">
        <Price size="md" tone={chargeable === 0 ? "muted" : "strong"}>
          {formatChf(minorUnitsToFrancs(chargeable), locale)}
        </Price>
      </p>
      {outcomeNote || showBillingNote ? (
        <>
          <PanelDivider className="mt-5" />
          {outcomeNote ? (
            <p className="mt-4 text-sm leading-6 text-ink">{outcomeNote}</p>
          ) : null}
          {showBillingNote ? (
            <p className="mt-2 text-sm leading-6 text-ink-muted">{t("bookBilling")}</p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

import {getTranslations} from "next-intl/server";

import {
  addZurichMonths,
  openZurichMonth,
  zurichMonthKey,
  type ZurichMonth,
} from "@/features/rooms/timezone";
import type {PathnameHref} from "@/i18n/href";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Button} from "@/shared/ui/button";
import {InputField} from "@/shared/ui/field";

export function billingPeriodSearch(from: ZurichMonth, to: ZurichMonth): {
  from?: string;
  to?: string;
} {
  const open = openZurichMonth();
  const singleOpen =
    from.year === open.year &&
    from.month === open.month &&
    to.year === open.year &&
    to.month === open.month;
  if (singleOpen) {
    return {};
  }
  return {from: zurichMonthKey(from), to: zurichMonthKey(to)};
}

export async function BillingPeriodPicker({
  action,
  from,
  to,
  hidden,
  hrefFor,
}: {
  locale: AppLocale;
  action: string;
  from: ZurichMonth;
  to: ZurichMonth;
  hidden?: Record<string, string | undefined>;
  hrefFor: (from: ZurichMonth, to: ZurichMonth) => PathnameHref;
}) {
  const t = await getTranslations("Admin");
  const open = openZurichMonth();
  const year = {from: {year: open.year, month: 1}, to: {year: open.year, month: 12}};
  const lastTwelve = {from: addZurichMonths(open, -11), to: open};

  return (
    <section className="mt-10 rounded-panel border border-ink bg-white p-5 sm:p-6">
      <h2 className="font-serif text-subheading">{t("billingPeriodTitle")}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{t("billingPeriodHelp")}</p>
      <form
        method="get"
        action={action}
        className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
      >
        {Object.entries(hidden ?? {}).map(([name, value]) =>
          value ? <input key={name} type="hidden" name={name} value={value} /> : null,
        )}
        <InputField
          id="billing-from"
          name="from"
          type="month"
          size="sm"
          numeric
          label={t("billingPeriodFrom")}
          defaultValue={zurichMonthKey(from)}
          required
        />
        <InputField
          id="billing-to"
          name="to"
          type="month"
          size="sm"
          numeric
          label={t("billingPeriodTo")}
          defaultValue={zurichMonthKey(to)}
          required
        />
        <Button type="submit" variant="secondary">
          {t("billingPeriodApply")}
        </Button>
      </form>
      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link href={hrefFor(open, open)} className="underline-offset-4 hover:underline">
          {t("billingPeriodThisMonth")}
        </Link>
        <Link href={hrefFor(year.from, year.to)} className="underline-offset-4 hover:underline">
          {t("billingPeriodThisYear")}
        </Link>
        <Link href={hrefFor(lastTwelve.from, lastTwelve.to)} className="underline-offset-4 hover:underline">
          {t("billingPeriodLastTwelve")}
        </Link>
      </p>
    </section>
  );
}

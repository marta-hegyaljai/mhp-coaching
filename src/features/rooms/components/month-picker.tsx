import {getTranslations} from "next-intl/server";

import {formatMonthYear} from "@/shared/format/calendar-date";
import {formatLocalDate, isZurichMonthClosed, type ZurichMonth} from "@/features/rooms/timezone";
import type {PathnameHref} from "@/i18n/href";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {StatusLabel} from "@/shared/ui/status-label";

export async function MonthPicker({
  locale,
  months,
  selected,
  now,
  hrefFor,
}: {
  locale: AppLocale;
  months: ZurichMonth[];
  selected: ZurichMonth;
  now?: Date;
  hrefFor: (month: ZurichMonth) => PathnameHref;
}) {
  const t = await getTranslations("Admin");
  const clock = now ?? new Date();

  return (
    <section className="mt-10">
      <h2 className="font-serif text-subheading">{t("billingMonths")}</h2>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {months.map((month) => {
          const key = `${month.year}-${String(month.month).padStart(2, "0")}`;
          const selectedMonth =
            month.year === selected.year && month.month === selected.month;
          const closed = isZurichMonthClosed(month, clock);
          const href = hrefFor(month);
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={selectedMonth ? "page" : undefined}
                aria-label={`${closed ? t("monthClosed") : t("monthOpen")} ${formatMonthYear(formatLocalDate(month.year, month.month, 1), locale)}`}
                className={`block h-full rounded-panel border p-4 transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                  selectedMonth
                    ? "border-ink bg-ink text-parchment"
                    : "border-ink bg-white hover:bg-hover"
                }`}
              >
                <StatusLabel
                  tone="strong"
                  className={selectedMonth ? "text-gold" : undefined}
                >
                  {closed ? t("monthClosed") : t("monthOpen")}
                </StatusLabel>
                <p
                  className={`mt-3 font-serif text-sm capitalize leading-5 ${
                    selectedMonth ? "text-parchment" : ""
                  }`}
                >
                  {formatMonthYear(formatLocalDate(month.year, month.month, 1), locale)}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

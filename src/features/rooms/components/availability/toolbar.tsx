import {getTranslations} from "next-intl/server";

import {availabilityHref, type AvailabilityQuery} from "@/features/rooms/query";
import {shiftLocalMonth} from "@/features/rooms/month-layout";
import {addLocalDays} from "@/features/rooms/timezone";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {formatDayRange, formatMonthYear, formatWeekdayDate} from "@/shared/format/calendar-date";
import {ChevronLeftIcon, ChevronRightIcon} from "@/shared/ui/icons";
import {SectionLabel} from "@/shared/ui/section-label";

import {PeriodJump} from "./period-jump";
import {AvailabilityViewSwitch} from "./view-switch";

const stepClass =
  "inline-flex min-h-11 items-center justify-center px-3 text-xs font-semibold uppercase tracking-[0.1em] text-ink transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export async function AvailabilityToolbar({
  locale,
  query,
  range,
  today,
}: {
  locale: AppLocale;
  query: AvailabilityQuery;
  range: {startDate: string; endDate: string};
  today: string;
}) {
  const t = await getTranslations("Rooms");
  const isWeek = query.view === "week";
  const isMonth = query.view === "month";
  const anchor = isWeek ? range.startDate : query.date;
  const previousDate = isMonth
    ? shiftLocalMonth(query.date, -1)
    : addLocalDays(anchor, isWeek ? -7 : -1);
  const nextDate = isMonth
    ? shiftLocalMonth(query.date, 1)
    : addLocalDays(anchor, isWeek ? 7 : 1);
  const rangeLabel = isMonth
    ? formatMonthYear(range.startDate, locale)
    : isWeek
      ? formatDayRange(range.startDate, range.endDate, locale)
      : formatWeekdayDate(query.date, locale);
  const showsToday = today >= range.startDate && today <= range.endDate;
  const previousLabel = isMonth
    ? t("previousMonth")
    : isWeek
      ? t("previousWeek")
      : t("previousDay");
  const nextLabel = isMonth ? t("nextMonth") : isWeek ? t("nextWeek") : t("nextDay");

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <SectionLabel>{t("timezoneLabel")}</SectionLabel>
        <p className="mt-2 font-sans text-lg font-semibold leading-tight tabular-nums text-ink sm:text-xl">
          {rangeLabel}
        </p>
        {showsToday ? (
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
            {t("includesToday")}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AvailabilityViewSwitch
          query={query}
          label={t("viewLabel")}
          dayLabel={t("viewDay")}
          weekLabel={t("viewWeek")}
          monthLabel={t("viewMonth")}
        />

        <PeriodJump locale={locale} query={query} today={today} />

        <div className="inline-flex rounded-panel border border-ink bg-white">
          <Link
            href={availabilityHref({...query, date: previousDate})}
            aria-label={previousLabel}
            className={stepClass}
          >
            <ChevronLeftIcon />
          </Link>
          <Link
            href={availabilityHref({...query, date: today})}
            className={`${stepClass} border-x border-ink`}
          >
            {t("today")}
          </Link>
          <Link
            href={availabilityHref({...query, date: nextDate})}
            aria-label={nextLabel}
            className={stepClass}
          >
            <ChevronRightIcon />
          </Link>
        </div>
      </div>
    </div>
  );
}

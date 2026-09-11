import {getTranslations} from "next-intl/server";

import {availabilityHref, type AvailabilityQuery} from "@/features/rooms/query";
import {addLocalDays} from "@/features/rooms/timezone";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {formatDayRange, formatWeekdayDate} from "@/shared/format/calendar-date";
import {ChevronLeftIcon, ChevronRightIcon} from "@/shared/ui/icons";
import {SectionLabel} from "@/shared/ui/section-label";
import {SegmentedLinks} from "@/shared/ui/segmented-links";

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
  const anchor = isWeek ? range.startDate : query.date;
  const step = isWeek ? 7 : 1;
  const rangeLabel = isWeek
    ? formatDayRange(range.startDate, range.endDate, locale)
    : formatWeekdayDate(query.date, locale);
  const showsToday = today >= range.startDate && today <= range.endDate;

  return (
    <div className="flex flex-col gap-5 border-b border-ink pb-6 lg:flex-row lg:items-end lg:justify-between">
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

      <div className="flex flex-wrap items-center gap-3">
        <SegmentedLinks
          label={t("viewLabel")}
          items={[
            {
              key: "day",
              href: availabilityHref({...query, view: "day"}),
              label: t("viewDay"),
              current: query.view === "day",
            },
            {
              key: "week",
              href: availabilityHref({...query, view: "week"}),
              label: t("viewWeek"),
              current: isWeek,
            },
          ]}
        />

        <div className="inline-flex rounded-panel border border-ink bg-white">
          <Link
            href={availabilityHref({...query, date: addLocalDays(anchor, -step)})}
            aria-label={isWeek ? t("previousWeek") : t("previousDay")}
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
            href={availabilityHref({...query, date: addLocalDays(anchor, step)})}
            aria-label={isWeek ? t("nextWeek") : t("nextDay")}
            className={stepClass}
          >
            <ChevronRightIcon />
          </Link>
        </div>
      </div>
    </div>
  );
}

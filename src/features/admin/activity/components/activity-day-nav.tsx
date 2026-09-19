"use client";

import {useRouter} from "@/i18n/navigation";
import {localizedPathname} from "@/i18n/path";
import type {AppLocale} from "@/i18n/routing";
import {DateField} from "@/shared/ui/date-field";

import {activityHref, type ActivityQuery} from "../query";
import {ActivityQueryFields} from "./activity-query-fields";

export function ActivityDayJump({
  locale,
  query,
  day,
  label,
}: {
  locale: AppLocale;
  query: ActivityQuery;
  day: string;
  label: string;
}) {
  const router = useRouter();

  return (
    <form
      method="get"
      action={localizedPathname(locale, "/admin/overview")}
      className="min-w-0"
      onChange={(event) => {
        const form = event.currentTarget;
        const data = new FormData(form);
        const next = String(data.get("day") ?? "");
        if (!next || next === day) {
          return;
        }
        router.push(activityHref({...query, day: next}), {scroll: false});
      }}
    >
      <ActivityQueryFields query={query} omit={["day"]} />
      <DateField
        id="activity-day"
        name="day"
        size="sm"
        variant="inline"
        required
        value={day}
        aria-label={label}
        fieldClassName="min-w-0"
      />
    </form>
  );
}

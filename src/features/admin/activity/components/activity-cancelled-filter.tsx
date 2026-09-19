"use client";

import {localizedPath} from "@/features/seo/metadata";
import type {AppLocale} from "@/i18n/routing";

import {type ActivityQuery} from "../query";
import type {ActivityWindow} from "../types";
import {ActivityQueryFields} from "./activity-query-fields";

export function ActivityCancelledFilter({
  locale,
  query,
  when,
  checked,
  label,
}: {
  locale: AppLocale;
  query: ActivityQuery;
  when: Exclude<ActivityWindow, "today">;
  checked: boolean;
  label: string;
}) {
  const name = when === "upcoming" ? "uc" : "hc";
  const omit = when === "upcoming" ? ["uc"] : ["hc", "hp"];

  return (
    <form
      method="get"
      action={localizedPath(locale, "/admin/overview")}
      className="min-w-0"
      onChange={(event) => {
        event.currentTarget.requestSubmit();
      }}
    >
      <ActivityQueryFields query={query} omit={omit} />
      <label className="flex cursor-pointer items-center gap-1.5 font-sans text-[0.7rem] font-semibold text-ink">
        <input
          type="checkbox"
          name={name}
          value="1"
          defaultChecked={checked}
          className="h-4 w-4 shrink-0 rounded-panel border-ink"
        />
        <span className="min-w-0 truncate">{label}</span>
      </label>
      <button type="submit" hidden>
        {label}
      </button>
    </form>
  );
}

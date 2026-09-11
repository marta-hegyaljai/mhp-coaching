"use client";

import {useId} from "react";
import {useTranslations} from "next-intl";

import {SelectField} from "@/shared/ui/field";

import type {SlotSelection} from "./use-slot-selection";

/**
 * Start and end always travel together: the end options belong to the chosen
 * start, so splitting them would let a form submit an impossible pair.
 */
export function SlotFields({
  starts,
  selection,
}: {
  starts: string[];
  selection: SlotSelection;
}) {
  const t = useTranslations("Rooms");
  const id = useId();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField
        id={`${id}-start`}
        name="start"
        numeric
        label={t("bookStart")}
        value={selection.start}
        onChange={(event) => selection.selectStart(event.target.value)}
      >
        {starts.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </SelectField>
      <SelectField
        id={`${id}-end`}
        name="end"
        numeric
        label={t("bookEnd")}
        value={selection.end}
        onChange={(event) => selection.selectEnd(event.target.value)}
      >
        {selection.ends.map((item) => (
          <option key={item.time} value={item.time}>
            {item.time} · {t("bookDuration", {minutes: item.durationMinutes})}
          </option>
        ))}
      </SelectField>
    </div>
  );
}

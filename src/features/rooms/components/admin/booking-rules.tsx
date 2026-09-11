"use client";

import {useId} from "react";
import {useTranslations} from "next-intl";

import {fieldStyles} from "@/shared/ui/field";

export type BookingRulesValues = {
  cancellationNoticeHours: number;
  bookingIntervalMinutes: number;
  minimumBookingMinutes: number;
  maximumBookingMinutes: number | null;
  maximumAdvanceBookingDays: number | null;
  reminderNoticeHours: number;
};

const controlClass = `mt-2 ${fieldStyles({numeric: true})}`;

export function BookingRulesFields({
  settings,
  intervalMinutes,
  onIntervalChange,
}: {
  settings: BookingRulesValues;
  intervalMinutes: number;
  onIntervalChange: (value: number) => void;
}) {
  const t = useTranslations("Rooms");
  const intervalId = useId();

  return (
    <div className="grid gap-5 rounded-panel border border-ink bg-white p-5 sm:grid-cols-2 sm:p-6">
      <div>
        <label htmlFor={intervalId} className="block text-sm font-medium text-ink">
          {t("interval")}
        </label>
        <select
          id={intervalId}
          name="bookingIntervalMinutes"
          value={intervalMinutes}
          onChange={(event) => onIntervalChange(Number(event.target.value))}
          className={controlClass}
        >
          <option value={15}>15</option>
          <option value={30}>30</option>
          <option value={60}>60</option>
        </select>
      </div>

      <NumberField
        name="minimumBookingMinutes"
        label={t("minimum")}
        defaultValue={settings.minimumBookingMinutes}
        min={15}
        step={15}
        required
      />
      <NumberField
        name="maximumBookingMinutes"
        label={t("maximum")}
        help={t("maximumHelp")}
        defaultValue={settings.maximumBookingMinutes}
        min={15}
        step={15}
      />
      <NumberField
        name="maximumAdvanceBookingDays"
        label={t("advance")}
        help={t("advanceHelp")}
        defaultValue={settings.maximumAdvanceBookingDays}
        min={0}
      />
      <NumberField
        name="cancellationNoticeHours"
        label={t("cancelNotice")}
        defaultValue={settings.cancellationNoticeHours}
        min={0}
        required
      />
      <NumberField
        name="reminderNoticeHours"
        label={t("reminder")}
        defaultValue={settings.reminderNoticeHours}
        min={0}
        required
      />
    </div>
  );
}

function NumberField({
  name,
  label,
  help,
  defaultValue,
  min,
  step,
  required = false,
}: {
  name: string;
  label: string;
  help?: string;
  defaultValue: number | null;
  min: number;
  step?: number;
  required?: boolean;
}) {
  const id = useId();
  const helpId = `${id}-help`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        min={min}
        step={step}
        required={required}
        defaultValue={defaultValue ?? ""}
        aria-describedby={help ? helpId : undefined}
        className={controlClass}
      />
      {help ? (
        <p id={helpId} className="mt-2 text-sm leading-6 text-ink-muted">
          {help}
        </p>
      ) : null}
    </div>
  );
}

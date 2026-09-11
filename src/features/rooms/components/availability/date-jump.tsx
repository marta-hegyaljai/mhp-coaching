"use client";

import {useTransition} from "react";
import {useSearchParams} from "next/navigation";

import {availabilityHref, type AvailabilityQuery} from "@/features/rooms/query";
import {useRouter} from "@/i18n/navigation";
import {CalendarIcon, SpinnerIcon} from "@/shared/ui/icons";

/** Native month picker for a one-step jump without leaving the calendar. */
export function DateJump({
  query,
  label,
}: {
  query: AvailabilityQuery;
  label: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const currentDate = searchParams.get("date") ?? query.date;

  return (
    <label className="inline-flex min-h-11 items-center gap-2 rounded-panel border border-ink bg-white px-3 text-ink">
      {pending ? <SpinnerIcon /> : <CalendarIcon />}
      <span className="sr-only">{label}</span>
      <input
        key={currentDate}
        type="date"
        aria-label={label}
        defaultValue={currentDate}
        disabled={pending}
        className="min-h-10 w-[8.7rem] cursor-pointer bg-transparent font-sans text-sm font-semibold tabular-nums outline-none disabled:cursor-progress"
        onChange={(event) => {
          const date = event.target.value;
          if (!date || date === currentDate) {
            return;
          }
          startTransition(() => {
            router.push(availabilityHref({...query, date}), {scroll: false});
          });
        }}
      />
    </label>
  );
}

"use client";

import {useSearchParams} from "next/navigation";

import {availabilityHref, type AvailabilityQuery} from "@/features/rooms/query";
import {SegmentedLinks} from "@/shared/ui/segmented-links";

export function AvailabilityViewSwitch({
  query,
  label,
  dayLabel,
  weekLabel,
}: {
  query: AvailabilityQuery;
  label: string;
  dayLabel: string;
  weekLabel: string;
}) {
  const searchParams = useSearchParams();
  const date = searchParams.get("date") ?? query.date;

  return (
    <SegmentedLinks
      label={label}
      items={[
        {
          key: "day",
          href: availabilityHref({...query, date, view: "day"}),
          label: dayLabel,
          current: query.view === "day",
        },
        {
          key: "week",
          href: availabilityHref({...query, date, view: "week"}),
          label: weekLabel,
          current: query.view === "week",
        },
      ]}
    />
  );
}

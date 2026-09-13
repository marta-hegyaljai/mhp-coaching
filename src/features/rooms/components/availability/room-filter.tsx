import {getTranslations} from "next-intl/server";

import type {AvailabilityRoom} from "@/features/rooms/availability";
import type {AvailabilityQuery} from "@/features/rooms/query";
import type {AppLocale} from "@/i18n/routing";
import {SectionLabel} from "@/shared/ui/section-label";

import {RoomFilterForm} from "./room-filter-form";

export async function RoomFilter({
  locale,
  query,
  rooms,
  selectedRoomIds,
}: {
  locale: AppLocale;
  query: AvailabilityQuery;
  rooms: AvailabilityRoom[];
  /** Empty means every active room is included. */
  selectedRoomIds: string[];
}) {
  const t = await getTranslations("Rooms");
  const selected = new Set(selectedRoomIds);
  const allSelected = selected.size === 0;

  return (
    <section aria-label={t("filterRooms")}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionLabel>{t("filterRooms")}</SectionLabel>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
            {t("filterRoomsHelp")}
          </p>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
          {allSelected
            ? t("allRoomsHint", {count: rooms.length})
            : t("selectedRoomsHint", {count: selected.size})}
        </p>
      </div>

      <div className="mt-3">
        <RoomFilterForm
          locale={locale}
          query={query}
          rooms={rooms}
          selectedRoomIds={selectedRoomIds}
          labels={{
            filterRooms: t("filterRooms"),
            allRooms: t("allRooms"),
            perHour: t("perHour"),
          }}
        />
      </div>
    </section>
  );
}

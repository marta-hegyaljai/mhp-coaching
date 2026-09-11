import {getTranslations} from "next-intl/server";

import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import type {AvailabilityRoom} from "@/features/rooms/availability";
import {availabilityHref, type AvailabilityQuery} from "@/features/rooms/query";
import {Link} from "@/i18n/navigation";
import {localizedPathname} from "@/i18n/path";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {SectionLabel} from "@/shared/ui/section-label";

const chipClass =
  "flex min-h-12 cursor-pointer items-center justify-between gap-2 rounded-panel border border-ink bg-white px-3 py-2 text-left text-ink transition-colors duration-150 ease-standard hover:bg-hover has-[:checked]:bg-ink has-[:checked]:text-parchment focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink";

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

      <form method="get" action={localizedPathname(locale, "/rooms")} className="mt-3">
        <input type="hidden" name="view" value={query.view} />
        <input type="hidden" name="date" value={query.date} />
        <fieldset>
          <legend className="sr-only">{t("filterRooms")}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <Link
            href={availabilityHref({...query, roomIds: []})}
            aria-current={allSelected ? "page" : undefined}
            className={`flex min-h-12 items-center justify-between gap-2 rounded-panel border px-3 py-2 text-left transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
              allSelected
                ? "border-ink bg-ink text-parchment"
                : "border-ink bg-white text-ink hover:bg-hover"
            }`}
          >
            <span className="text-sm font-semibold">{t("allRooms")}</span>
            <span className={`text-xs ${allSelected ? "text-parchment/80" : "text-ink-muted"}`}>
              {t("allRoomsHint", {count: rooms.length})}
            </span>
          </Link>

        {rooms.map((room) => {
          const checked = selected.has(room.id);

          return (
            <label key={room.id} className={chipClass}>
              <input
                type="checkbox"
                name="rooms"
                value={room.id}
                defaultChecked={checked}
                className="h-4 w-4 shrink-0 cursor-pointer accent-white"
              />
              <span className="min-w-0 flex-1 text-sm font-semibold leading-tight">
                {room.name}
              </span>
              <span className="font-sans text-xs font-semibold tabular-nums leading-none">
                {formatChf(minorUnitsToFrancs(room.hourlyRateMinor), locale)}
                {t("perHour")}
              </span>
            </label>
          );
        })}
          </div>
        </fieldset>

        <button type="submit" className={`${buttonStyles()} mt-3`}>
          {t("applyRoomFilter")}
        </button>
      </form>
    </section>
  );
}

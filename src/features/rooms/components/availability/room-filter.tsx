import {getTranslations} from "next-intl/server";

import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import type {AvailabilityRoom} from "@/features/rooms/availability";
import {availabilityHref, type AvailabilityQuery} from "@/features/rooms/query";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Price} from "@/shared/ui/price";
import {SectionLabel} from "@/shared/ui/section-label";

const chipClass =
  "flex min-h-20 flex-col justify-between gap-2 rounded-panel border px-3 py-3 text-left transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export async function RoomFilter({
  locale,
  query,
  rooms,
  selectedRoomId,
  allowAllRooms,
}: {
  locale: AppLocale;
  query: AvailabilityQuery;
  rooms: AvailabilityRoom[];
  /** The room the grid actually shows, so the marked chip is never a guess. */
  selectedRoomId?: string;
  allowAllRooms: boolean;
}) {
  const t = await getTranslations("Rooms");
  const allSelected = allowAllRooms && !selectedRoomId;

  return (
    <section aria-label={t("filterRooms")}>
      <SectionLabel>{t("filterRooms")}</SectionLabel>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {allowAllRooms ? (
          <Link
            href={availabilityHref({...query, roomId: undefined})}
            aria-current={allSelected ? "page" : undefined}
            className={`${chipClass} ${
              allSelected
                ? "border-ink bg-ink text-parchment"
                : "border-ink bg-white text-ink hover:bg-hover"
            }`}
          >
            <span className="text-sm font-semibold">{t("allRooms")}</span>
            <span
              className={`text-xs ${allSelected ? "text-parchment/80" : "text-ink-muted"}`}
            >
              {t("allRoomsHint", {count: rooms.length})}
            </span>
          </Link>
        ) : null}

        {rooms.map((room) => {
          const selected = room.id === selectedRoomId;

          return (
            <Link
              key={room.id}
              href={availabilityHref({...query, roomId: room.id})}
              aria-current={selected ? "page" : undefined}
              className={`${chipClass} ${
                selected
                  ? "border-ink bg-ink text-parchment"
                  : "border-ink bg-white text-ink hover:bg-hover"
              }`}
            >
              <span className="text-sm font-semibold leading-tight">{room.name}</span>
              {room.description ? (
                <span
                  className={`line-clamp-2 text-xs leading-4 ${
                    selected ? "text-parchment/75" : "text-ink-muted"
                  }`}
                >
                  {room.description}
                </span>
              ) : null}
              <Price size="sm" className={selected ? "text-parchment" : ""}>
                {formatChf(minorUnitsToFrancs(room.hourlyRateMinor), locale)}
                {t("perHour")}
              </Price>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

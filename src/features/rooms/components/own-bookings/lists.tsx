"use client";

import type {ReactNode} from "react";

import {OWN_BOOKINGS_LAYOUT_KEY} from "@/features/rooms/components/booking-list/layout";
import {
  BookingsLayoutSwitch,
  useBookingsLayout,
} from "@/features/rooms/components/booking-list/layout-switch";
import {OwnBookingCards} from "@/features/rooms/components/own-bookings/booking-cards";
import {
  OwnBookingTable,
  type OwnBookingTableLabels,
} from "@/features/rooms/components/own-bookings/booking-table";
import type {OwnBookingItem} from "@/features/rooms/components/own-bookings/item";
import {Toolbar, ToolbarRow, toolbarGroupClass} from "@/shared/ui/toolbar";

export function OwnBookingLists({
  upcoming,
  history,
  upcomingTitle,
  historyTitle,
  upcomingEmpty,
  historyEmpty,
  openLabel,
  layoutLabel,
  tableLabel,
  cardsLabel,
  upcomingCount,
  historyCount,
  tableLabels,
  toolbar,
}: {
  upcoming: OwnBookingItem[];
  history: OwnBookingItem[];
  upcomingTitle: string;
  historyTitle: string;
  historyEmpty: string;
  upcomingEmpty: string;
  openLabel: string;
  layoutLabel: string;
  tableLabel: string;
  cardsLabel: string;
  upcomingCount: string;
  historyCount: string;
  tableLabels: OwnBookingTableLabels;
  toolbar?: ReactNode;
}) {
  const [layout, setLayout] = useBookingsLayout(OWN_BOOKINGS_LAYOUT_KEY);

  return (
    <div className="mt-8">
      <Toolbar>
        <ToolbarRow className={`${toolbarGroupClass} justify-between`}>
          {toolbar ?? <span />}
          <BookingsLayoutSwitch
            label={layoutLabel}
            tableLabel={tableLabel}
            cardsLabel={cardsLabel}
            value={layout}
            onChange={setLayout}
          />
        </ToolbarRow>
      </Toolbar>

      <div className="mt-8 space-y-8">
        <BookingGroup
          title={upcomingTitle}
          count={upcomingCount}
          empty={upcomingEmpty}
          items={upcoming}
          layout={layout}
          openLabel={openLabel}
          tableLabels={tableLabels}
        />
        <BookingGroup
          title={historyTitle}
          count={historyCount}
          empty={historyEmpty}
          items={history}
          layout={layout}
          openLabel={openLabel}
          tableLabels={tableLabels}
        />
      </div>
    </div>
  );
}

function BookingGroup({
  title,
  count,
  empty,
  items,
  layout,
  openLabel,
  tableLabels,
}: {
  title: string;
  count: string;
  empty: string;
  items: OwnBookingItem[];
  layout: "table" | "cards";
  openLabel: string;
  tableLabels: OwnBookingTableLabels;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-serif text-subheading">{title}</h2>
        <p className="font-sans text-sm tabular-nums text-ink-muted">{count}</p>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm leading-7 text-ink-muted">{empty}</p>
      ) : (
        <div className="mt-4">
          <div className="lg:hidden">
            <OwnBookingCards items={items} openLabel={openLabel} todayLabel={tableLabels.today} />
          </div>
          <div className="hidden lg:block">
            {layout === "table" ? (
              <OwnBookingTable items={items} labels={tableLabels} />
            ) : (
              <OwnBookingCards items={items} openLabel={openLabel} todayLabel={tableLabels.today} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

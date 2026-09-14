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
  tableLabels: OwnBookingTableLabels;
  toolbar?: ReactNode;
}) {
  const [layout, setLayout] = useBookingsLayout(OWN_BOOKINGS_LAYOUT_KEY);

  return (
    <div className="mt-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {toolbar ?? <span />}
        <BookingsLayoutSwitch
          label={layoutLabel}
          tableLabel={tableLabel}
          cardsLabel={cardsLabel}
          value={layout}
          onChange={setLayout}
        />
      </div>
      <BookingGroup
        title={upcomingTitle}
        empty={upcomingEmpty}
        items={upcoming}
        layout={layout}
        openLabel={openLabel}
        tableLabels={tableLabels}
      />
      <BookingGroup
        title={historyTitle}
        empty={historyEmpty}
        items={history}
        layout={layout}
        openLabel={openLabel}
        tableLabels={tableLabels}
      />
    </div>
  );
}

function BookingGroup({
  title,
  empty,
  items,
  layout,
  openLabel,
  tableLabels,
}: {
  title: string;
  empty: string;
  items: OwnBookingItem[];
  layout: "table" | "cards";
  openLabel: string;
  tableLabels: OwnBookingTableLabels;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-subheading">{title}</h2>
        <p className="font-sans text-sm tabular-nums text-ink-muted">{items.length}</p>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm leading-7 text-ink-muted">{empty}</p>
      ) : (
        <div className="mt-3">
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

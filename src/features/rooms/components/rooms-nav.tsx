import {getTranslations} from "next-intl/server";

import {SegmentedLinks} from "@/shared/ui/segmented-links";

export async function RoomsNav({current}: {current: "calendar" | "bookings" | "requests"}) {
  const t = await getTranslations("Rooms");

  return (
    <div className="mt-6">
      <SegmentedLinks
        label={t("navLabel")}
        items={[
          {
            key: "calendar",
            href: "/rooms",
            label: t("navCalendar"),
            current: current === "calendar",
          },
          {
            key: "bookings",
            href: "/rooms/bookings",
            label: t("navBookings"),
            current: current === "bookings",
          },
          {
            key: "requests",
            href: "/rooms/requests",
            label: t("navRequests"),
            current: current === "requests",
          },
        ]}
      />
    </div>
  );
}

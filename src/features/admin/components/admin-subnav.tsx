import type {PathnameHref} from "@/i18n/href";
import {Link} from "@/i18n/navigation";

export type AdminSection = "users" | "bookings" | "rooms" | "settings";

const hrefs: Record<AdminSection, PathnameHref> = {
  users: "/admin/users",
  bookings: "/admin/bookings",
  rooms: "/admin/rooms",
  settings: "/admin/settings",
};

const order: AdminSection[] = ["users", "bookings", "rooms", "settings"];

const itemClass =
  "inline-flex min-h-11 items-center border-b-2 px-1 text-sm font-semibold tracking-[0.02em] transition-colors duration-150 ease-standard";

export function adminSectionLabels(admin: {
  (key: "title" | "bookingsNav" | "roomsNav" | "settingsNav"): string;
}): Record<AdminSection, string> {
  return {
    users: admin("title"),
    bookings: admin("bookingsNav"),
    rooms: admin("roomsNav"),
    settings: admin("settingsNav"),
  };
}

export function AdminSubnav({
  current,
  label,
  labels,
}: {
  current: AdminSection;
  /** Names the landmark itself; the tab labels name the destinations. */
  label: string;
  labels: Record<AdminSection, string>;
}) {
  return (
    <nav aria-label={label} className="mt-6 flex flex-wrap gap-5 border-b border-line">
      {order.map((section) => {
        const active = section === current;

        return (
          <Link
            key={section}
            href={hrefs[section]}
            aria-current={active ? "page" : undefined}
            className={`${itemClass} ${
              active
                ? "border-ink text-ink"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {labels[section]}
          </Link>
        );
      })}
    </nav>
  );
}

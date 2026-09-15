import type {PathnameHref} from "@/i18n/href";
import {Link} from "@/i18n/navigation";

export type AdminSection =
  | "users"
  | "courses"
  | "calls"
  | "bookings"
  | "requests"
  | "rooms"
  | "billing"
  | "settings";

const hrefs: Record<AdminSection, PathnameHref> = {
  users: "/admin/users",
  courses: "/admin/courses",
  calls: "/admin/calls",
  bookings: "/admin/bookings",
  requests: "/admin/requests",
  rooms: "/admin/rooms",
  billing: "/admin/billing",
  settings: "/admin/settings",
};

const order: AdminSection[] = [
  "users",
  "courses",
  "calls",
  "bookings",
  "requests",
  "rooms",
  "billing",
  "settings",
];

const itemClass =
  "inline-flex min-h-11 items-center border-b-2 px-1 text-sm font-semibold tracking-[0.02em] transition-colors duration-150 ease-standard";

export function adminSectionLabels(admin: {
  (
    key:
      | "title"
      | "coursesNav"
      | "callsNav"
      | "bookingsNav"
      | "requestsNav"
      | "roomsNav"
      | "billingNav"
      | "settingsNav",
  ): string;
}): Record<AdminSection, string> {
  return {
    users: admin("title"),
    courses: admin("coursesNav"),
    calls: admin("callsNav"),
    bookings: admin("bookingsNav"),
    requests: admin("requestsNav"),
    rooms: admin("roomsNav"),
    billing: admin("billingNav"),
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

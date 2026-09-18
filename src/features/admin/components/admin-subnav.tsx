import type {PathnameHref} from "@/i18n/href";
import {Link} from "@/i18n/navigation";

export type AdminSection =
  | "overview"
  | "users"
  | "courses"
  | "calls"
  | "bookings"
  | "requests"
  | "rooms"
  | "billing"
  | "settings";

const hrefs: Record<AdminSection, PathnameHref> = {
  overview: "/admin/overview",
  users: "/admin/users",
  courses: "/admin/courses",
  calls: "/admin/calls",
  bookings: "/admin/bookings",
  requests: "/admin/requests",
  rooms: "/admin/rooms",
  billing: "/admin/billing",
  settings: "/admin/settings",
};

// The control panel leads: it is where an admin starts the day.
const order: AdminSection[] = [
  "overview",
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
      | "overviewNav"
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
    overview: admin("overviewNav"),
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

/**
 * Admin destinations stay one row on a phone: the tabs scroll under the thumb
 * instead of wrapping into a three-line block that hides the records.
 * Vertical gap belongs on WorkspacePage; do not add a default top margin here.
 */
export function AdminSubnav({
  current,
  label,
  labels,
  className = "",
}: {
  current: AdminSection;
  /** Names the landmark itself; the tab labels name the destinations. */
  label: string;
  labels: Record<AdminSection, string>;
  className?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={`flex min-w-0 gap-5 overflow-x-auto overscroll-x-contain border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {order.map((section) => {
        const active = section === current;

        return (
          <Link
            key={section}
            href={hrefs[section]}
            aria-current={active ? "page" : undefined}
            className={`${itemClass} shrink-0 ${
              active
                ? "border-gold-deep text-gold-deep"
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

import type {PathnameHref} from "@/i18n/href";
import type {WorkspaceNavModel} from "@/shared/ui/workspace-nav";

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

export function adminWorkspaceNav(
  current: AdminSection,
  copy: {
    eyebrow: string;
    label: string;
    labels: Record<AdminSection, string>;
  },
): WorkspaceNavModel {
  return {
    eyebrow: copy.eyebrow,
    label: copy.label,
    current,
    items: order.map((key) => ({
      key,
      href: hrefs[key],
      label: copy.labels[key],
    })),
  };
}

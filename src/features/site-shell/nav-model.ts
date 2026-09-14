import type {Viewer} from "@/features/auth/require";
import type {PathnameHref} from "@/i18n/href";
import type {OriginKind} from "@/lib/origins";

/** Key inside the `Nav` message namespace. */
export type NavLabelKey =
  | "courses"
  | "caseLibrary"
  | "insights"
  | "about"
  | "contact"
  | "rooms"
  | "admin"
  | "account"
  | "myCourses";

export type NavEntry = {
  key: NavLabelKey;
  href: PathnameHref;
  origin: OriginKind;
  /** Route prefix that marks this entry as the open section. */
  match: string;
  /** Parents of nested routes only count when the route matches exactly. */
  exact?: boolean;
};

/**
 * Product sections, in reading order. Capability-gated entries appear only
 * when the server already granted the capability, never as disabled decoy
 * links.
 */
export function primaryNavEntries(viewer: Viewer | null): NavEntry[] {
  const entries: NavEntry[] = [
    {key: "courses", href: "/courses", origin: "marketing", match: "/courses"},
    {key: "caseLibrary", href: "/case-library", origin: "marketing", match: "/case-library"},
    {key: "insights", href: "/insights", origin: "marketing", match: "/insights"},
    {key: "about", href: "/about", origin: "marketing", match: "/about"},
    {key: "contact", href: "/contact", origin: "marketing", match: "/contact"},
  ];

  if (viewer?.canAccessRooms) {
    entries.push({key: "rooms", href: "/rooms", origin: "app", match: "/rooms"});
  }

  if (viewer?.isAdmin) {
    entries.push({key: "admin", href: "/admin/users", origin: "app", match: "/admin"});
  }

  return entries;
}

/** Personal destinations. These never sit in the product navigation. */
export const accountNavEntries: readonly NavEntry[] = [
  {key: "account", href: "/account", origin: "app", match: "/account", exact: true},
  {
    key: "myCourses",
    href: "/account/courses",
    origin: "app",
    match: "/account/courses",
  },
];

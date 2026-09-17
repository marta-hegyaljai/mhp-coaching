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
  | "advice"
  | "reviews"
  | "rooms"
  | "admin"
  | "account"
  | "myCourses";

/** Key of a header control that opens several destinations at once. */
export type NavGroupKey = "school";

/** One-line description shown beside a label inside a grouped menu. */
export type NavHintKey =
  | "caseLibraryHint"
  | "insightsHint"
  | "aboutHint"
  | "contactHint";

export type NavEntry = {
  key: NavLabelKey;
  href: PathnameHref;
  origin: OriginKind;
  /** Route prefix that marks this entry as the open section. */
  match: string;
  /** Parents of nested routes only count when the route matches exactly. */
  exact?: boolean;
  /** Grouped destinations explain themselves; single chips do not need it. */
  hint?: NavHintKey;
};

export type NavGroup = {
  key: NavGroupKey;
  /** Destinations behind one control. Each keeps its own route and label. */
  entries: NavEntry[];
};

export type NavNode = NavEntry | NavGroup;

export function isNavGroup(node: NavNode): node is NavGroup {
  return "entries" in node;
}

/**
 * Everything about the school that is not a course: its writing, its founder
 * and how to reach it. Bundling them keeps the bar down to the two decisions
 * that matter — browse the courses, or book a place.
 */
const schoolGroup: NavGroup = {
  key: "school",
  entries: [
    {
      key: "caseLibrary",
      href: "/case-library",
      origin: "marketing",
      match: "/case-library",
      hint: "caseLibraryHint",
    },
    {
      key: "insights",
      href: "/insights",
      origin: "marketing",
      match: "/insights",
      hint: "insightsHint",
    },
    {key: "about", href: "/about", origin: "marketing", match: "/about", hint: "aboutHint"},
    {
      key: "contact",
      href: "/contact",
      origin: "marketing",
      match: "/contact",
      hint: "contactHint",
    },
  ],
};

/**
 * Header navigation, in reading order. Capability-gated entries appear only
 * when the server already granted the capability, never as disabled decoy
 * links, and stay single chips because they are working destinations.
 */
export function primaryNavNodes(viewer: Viewer | null): NavNode[] {
  const nodes: NavNode[] = [
    {key: "courses", href: "/courses", origin: "marketing", match: "/courses"},
    schoolGroup,
  ];

  if (viewer?.canAccessRooms) {
    nodes.push({key: "rooms", href: "/rooms", origin: "app", match: "/rooms"});
  }

  if (viewer?.isAdmin) {
    nodes.push({key: "admin", href: "/admin/users", origin: "app", match: "/admin"});
  }

  return nodes;
}

/** Every product destination, flattened: the phone sheet and the footer map. */
export function primaryNavEntries(viewer: Viewer | null): NavEntry[] {
  return primaryNavNodes(viewer).flatMap((node) =>
    isNavGroup(node) ? node.entries : [node],
  );
}

/**
 * Destinations that belong on the footer map but not in the header bar, which
 * stays limited to the two decisions that matter. The home page and shared
 * links carry these instead.
 */
export const footerNavEntries: readonly NavEntry[] = [
  {key: "advice", href: "/advice", origin: "marketing", match: "/advice"},
  {key: "reviews", href: "/reviews", origin: "marketing", match: "/reviews"},
];

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

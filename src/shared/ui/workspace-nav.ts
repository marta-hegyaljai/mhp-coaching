import type {PathnameHref} from "@/i18n/href";

export type WorkspaceNavItem = {
  key: string;
  href: PathnameHref;
  label: string;
};

export type WorkspaceNavModel = {
  /** Gold uppercase workspace name: Administration, Rooms, Account. */
  eyebrow: string;
  /** Names the landmark; the item labels name the destinations. */
  label: string;
  current: string;
  items: WorkspaceNavItem[];
};

export function workspaceCurrentLabel(nav: WorkspaceNavModel): string {
  return nav.items.find((item) => item.key === nav.current)?.label ?? nav.eyebrow;
}

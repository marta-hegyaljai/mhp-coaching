import type {ReactNode} from "react";
import {getTranslations} from "next-intl/server";

import {SiteShell} from "@/features/site-shell/site-shell";
import type {PathnameHref} from "@/i18n/href";
import type {AppLocale} from "@/i18n/routing";
import type {WorkspaceNavModel} from "@/shared/ui/workspace-nav";

export type RoomsSection = "calendar" | "bookings" | "requests" | "usage";

export async function roomsWorkspaceNav(
  current: RoomsSection,
): Promise<WorkspaceNavModel> {
  const t = await getTranslations("Rooms");

  return {
    eyebrow: t("eyebrow"),
    label: t("navLabel"),
    current,
    items: [
      {key: "calendar", href: "/rooms", label: t("navCalendar")},
      {key: "bookings", href: "/rooms/bookings", label: t("navBookings")},
      {key: "requests", href: "/rooms/requests", label: t("navRequests")},
      {key: "usage", href: "/billing", label: t("navUsage")},
    ],
  };
}

export async function RoomsWorkspace({
  locale,
  current,
  hreflangs,
  children,
}: {
  locale: AppLocale;
  current: RoomsSection;
  hreflangs?: Partial<Record<AppLocale, PathnameHref>>;
  children: ReactNode;
}) {
  return (
    <SiteShell
      locale={locale}
      footerCta={null}
      hreflangs={hreflangs}
      workspace={await roomsWorkspaceNav(current)}
    >
      {children}
    </SiteShell>
  );
}

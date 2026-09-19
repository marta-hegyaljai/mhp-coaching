import type {ReactNode} from "react";
import {getTranslations} from "next-intl/server";

import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";

import {
  adminSectionLabels,
  adminWorkspaceNav,
  type AdminSection,
} from "./admin-subnav";

export async function AdminWorkspace({
  locale,
  current,
  fillViewport = false,
  children,
}: {
  locale: AppLocale;
  current: AdminSection;
  fillViewport?: boolean;
  children: ReactNode;
}) {
  const t = await getTranslations("Admin");

  return (
    <SiteShell
      locale={locale}
      footerCta={null}
      fillViewport={fillViewport}
      workspace={adminWorkspaceNav(current, {
        eyebrow: t("eyebrow"),
        label: t("sectionsNav"),
        labels: adminSectionLabels(t),
      })}
    >
      {children}
    </SiteShell>
  );
}

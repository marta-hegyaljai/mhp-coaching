import type {ReactNode} from "react";
import {getTranslations} from "next-intl/server";

import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import type {WorkspaceNavModel} from "@/shared/ui/workspace-nav";

export type AccountSection = "profile" | "courses";

export async function accountWorkspaceNav(
  current: AccountSection,
): Promise<WorkspaceNavModel> {
  const t = await getTranslations("Auth");

  return {
    eyebrow: t("eyebrow"),
    label: t("accountNav"),
    current,
    items: [
      {key: "profile", href: "/account", label: t("profileTitle")},
      {key: "courses", href: "/account/courses", label: t("myCoursesLink")},
    ],
  };
}

export async function AccountWorkspace({
  locale,
  current,
  children,
}: {
  locale: AppLocale;
  current: AccountSection;
  children: ReactNode;
}) {
  return (
    <SiteShell
      locale={locale}
      footerCta={null}
      workspace={await accountWorkspaceNav(current)}
    >
      {children}
    </SiteShell>
  );
}

import {getTranslations, setRequestLocale} from "next-intl/server";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {NotificationEvidenceList} from "@/features/rooms/components/notification-evidence-list";
import {loadRecentNotifications} from "@/features/rooms/notifications";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {BackLink} from "@/shared/ui/back-link";
import {WorkspacePage} from "@/shared/ui/workspace-page";

type AdminNotificationsPageProps = {
  params: Promise<{locale: AppLocale}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdminNotificationsPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});

  return buildPageMetadata({
    locale,
    title: t("notificationsTitle"),
    description: t("notificationsIntro"),
    hrefForLocale: () => "/admin/notifications",
    robots: {index: false, follow: false},
  });
}

export default async function AdminNotificationsPage({params}: AdminNotificationsPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const actor = await requireAdmin(locale, localizedPath(locale, "/admin/notifications"));
  const t = await getTranslations("Admin");
  const rows = await loadRecentNotifications(actor);

  return (
    <SiteShell locale={locale} footerCta={null}>
      <WorkspacePage
        eyebrow={t("eyebrow")}
        nav={
          <AdminSubnav
            current="billing"
            label={t("sectionsNav")}
            labels={adminSectionLabels(t)}
          />
        }
        back={<BackLink href="/admin/billing">{t("backToBilling")}</BackLink>}
        title={t("notificationsTitle")}
        intro={t("notificationsIntro")}
      >
        <NotificationEvidenceList rows={rows} empty={t("notificationsEmpty")} />
      </WorkspacePage>
    </SiteShell>
  );
}

import {getTranslations, setRequestLocale} from "next-intl/server";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {NotificationEvidenceList} from "@/features/rooms/components/notification-evidence-list";
import {loadRecentNotifications} from "@/features/rooms/notifications";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

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
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <AdminSubnav
          current="billing"
          label={t("sectionsNav")}
          labels={adminSectionLabels(t)}
        />
        <p className="mt-6 text-sm">
          <Link href="/admin/billing" className="underline-offset-4 hover:underline">
            {t("backToBilling")}
          </Link>
        </p>
        <h1 className="mt-3 font-serif text-heading">{t("notificationsTitle")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">{t("notificationsIntro")}</p>
        <NotificationEvidenceList rows={rows} empty={t("notificationsEmpty")} />
      </Section>
    </SiteShell>
  );
}

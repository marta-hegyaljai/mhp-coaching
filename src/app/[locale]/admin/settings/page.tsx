import {getTranslations, setRequestLocale} from "next-intl/server";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {RoomSettingsForm} from "@/features/rooms/components/admin/settings-form";
import {getBookingSettings, listOpeningIntervals} from "@/features/rooms/settings";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

type AdminSettingsPageProps = {
  params: Promise<{locale: AppLocale}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdminSettingsPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Rooms"});

  return buildPageMetadata({
    locale,
    title: t("settingsTitle"),
    description: t("settingsIntro"),
    hrefForLocale: () => "/admin/settings",
    robots: {index: false, follow: false},
  });
}

export default async function AdminSettingsPage({params}: AdminSettingsPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  await requireAdmin(locale, localizedPath(locale, "/admin/settings"));
  const t = await getTranslations("Rooms");
  const admin = await getTranslations("Admin");
  const [settings, hours] = await Promise.all([
    getBookingSettings(),
    listOpeningIntervals(),
  ]);

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{admin("eyebrow")}</Eyebrow>
        <AdminSubnav
          current="settings"
          label={admin("sectionsNav")}
          labels={adminSectionLabels(admin)}
        />
        <h1 className="mt-3 font-serif text-heading">{t("settingsTitle")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">{t("settingsIntro")}</p>
        <div className="mt-10">
          <RoomSettingsForm locale={locale} settings={settings} hours={hours} />
        </div>
      </Section>
    </SiteShell>
  );
}

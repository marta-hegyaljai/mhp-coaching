import {getTranslations, setRequestLocale} from "next-intl/server";

import {AdminWorkspace} from "@/features/admin/components/admin-workspace";
import {requireAdmin} from "@/features/auth/require";
import {HeartbeatList} from "@/features/ops/components/heartbeat-list";
import {listRecentHeartbeats} from "@/features/ops/heartbeats";
import {RoomSettingsForm} from "@/features/rooms/components/admin/settings-form";
import {getBookingSettings, listOpeningIntervals} from "@/features/rooms/settings";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import type {AppLocale} from "@/i18n/routing";
import {WorkspacePage} from "@/shared/ui/workspace-page";

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
  const [settings, hours, heartbeats] = await Promise.all([
    getBookingSettings(),
    listOpeningIntervals(),
    listRecentHeartbeats(),
  ]);

  return (
    <AdminWorkspace locale={locale} current="settings">
      <WorkspacePage
        title={t("settingsTitle")}
        intro={t("settingsIntro")}
      >
        <div className="mt-10">
          <RoomSettingsForm locale={locale} settings={settings} hours={hours} />
        </div>
        <section className="mt-16">
          <h2 className="font-serif text-subheading">{admin("opsTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">{admin("opsHelp")}</p>
          <HeartbeatList
            rows={heartbeats}
            empty={admin("opsEmpty")}
            okLabel={admin("opsOk")}
            failedLabel={admin("opsFailed")}
          />
        </section>
      </WorkspacePage>
    </AdminWorkspace>
  );
}

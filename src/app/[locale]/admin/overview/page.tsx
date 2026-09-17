import {getTranslations, setRequestLocale} from "next-intl/server";

import {ActivityBoard} from "@/features/admin/activity/components/activity-board";
import {ActivitySearch} from "@/features/admin/activity/components/activity-search";
import {activityCopy, activityKindLabels} from "@/features/admin/activity/copy";
import {loadActivityBriefing} from "@/features/admin/activity/feed";
import {activityHref, parseActivityQuery} from "@/features/admin/activity/query";
import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";

type AdminOverviewPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{
    when?: string | string[];
    kind?: string | string[];
    q?: string | string[];
    page?: string | string[];
    hp?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdminOverviewPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});

  return buildPageMetadata({
    locale,
    title: t("overviewTitle"),
    description: t("overviewIntro"),
    hrefForLocale: () => "/admin/overview",
    robots: {index: false, follow: false},
  });
}

export default async function AdminOverviewPage({
  params,
  searchParams,
}: AdminOverviewPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const query = parseActivityQuery(await searchParams);
  await requireAdmin(locale, localizedPath(locale, activityHref(query)));

  const t = await getTranslations("Admin");
  const [copy, kindLabels] = await Promise.all([
    activityCopy(locale),
    activityKindLabels(locale),
  ]);
  const briefing = await loadActivityBriefing({query, locale, copy});
  const listLabels = {
    list: t("activityList"),
    open: t("activityOpen"),
    kinds: kindLabels.chip,
    actionLabels: {
      waitlist: {
        notify: t("coursesWaitlistMarkNotified"),
        remove: t("activityWaitlistRemove"),
        confirmRemove: t("activityWaitlistConfirmRemove"),
        keep: t("activityWaitlistKeep"),
      },
    },
    emptySearch: t("activityEmptySearch"),
    log: t("activityLog"),
    pageStatus: (page: number, pageCount: number) => t("pageStatus", {page, pageCount}),
    previous: t("previous"),
    next: t("next"),
  };

  return (
    <SiteShell locale={locale} footerCta={null} fillViewport>
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 py-2 sm:gap-3 sm:px-5 sm:py-3 lg:px-8">
        <h1 className="sr-only">{t("overviewTitle")}</h1>
        <div className="flex shrink-0 flex-col gap-2 lg:flex-row lg:items-end lg:gap-6">
          <AdminSubnav
            current="overview"
            label={t("sectionsNav")}
            labels={adminSectionLabels(t)}
            className="mt-0 min-w-0 flex-1"
          />
          <ActivitySearch
            action={localizedPath(locale, "/admin/overview")}
            query={query}
            className="lg:w-80 lg:shrink-0"
            labels={{
              filter: t("filter"),
              search: t("activitySearch"),
              searchPlaceholder: t("activitySearchPlaceholder"),
              clear: t("clearFilters"),
            }}
          />
        </div>
        <ActivityBoard
          briefing={briefing}
          query={query}
          locale={locale}
          labels={{
            ...listLabels,
            today: t("activityToday"),
            upcoming: t("activityUpcoming"),
            history: t("activityHistory"),
            emptyToday: t("activityEmptyToday"),
            emptyUpcoming: t("activityEmptyUpcoming"),
            emptyHistory: t("activityEmptyHistory"),
          }}
        />
      </div>
    </SiteShell>
  );
}

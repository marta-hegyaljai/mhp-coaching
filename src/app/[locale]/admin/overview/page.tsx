import {getTranslations, setRequestLocale} from "next-intl/server";

import {ActivityBoard} from "@/features/admin/activity/components/activity-board";
import {ActivityRefresh} from "@/features/admin/activity/components/activity-refresh";
import {ActivitySearch} from "@/features/admin/activity/components/activity-search";
import {activityCopy, activityKindLabels} from "@/features/admin/activity/copy";
import {loadActivityBriefing} from "@/features/admin/activity/feed";
import {activityHref, parseActivityQuery} from "@/features/admin/activity/query";
import {AdminWorkspace} from "@/features/admin/components/admin-workspace";
import {requireAdmin} from "@/features/auth/require";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import type {AppLocale} from "@/i18n/routing";

type AdminOverviewPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{
    when?: string | string[];
    kind?: string | string[];
    q?: string | string[];
    page?: string | string[];
    hp?: string | string[];
    day?: string | string[];
    uc?: string | string[];
    hc?: string | string[];
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
      reply: t("inquiryReplyAction"),
    },
    emptySearch: t("activityEmptySearch"),
    log: t("activityLog"),
    pageStatus: (page: number, pageCount: number) => t("pageStatus", {page, pageCount}),
    previous: t("previous"),
    next: t("next"),
  };

  return (
    <AdminWorkspace locale={locale} current="overview" fillViewport>
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 py-2 sm:gap-3 sm:px-5 sm:py-3 lg:px-6">
        <h1 className="sr-only">{t("overviewTitle")}</h1>
        <div className="flex shrink-0 items-center gap-2">
          <ActivityRefresh
            labels={{
              refresh: t("activityRefresh"),
              refreshing: t("activityRefreshing"),
            }}
          />
          <ActivitySearch
            action={localizedPath(locale, "/admin/overview")}
            query={query}
            className="min-w-0 flex-1 lg:ml-auto lg:max-w-md"
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
            windows: t("activityWindowGroup"),
            emptyToday: t("activityEmptyToday"),
            emptyUpcoming: t("activityEmptyUpcoming"),
            emptyHistory: t("activityEmptyHistory"),
            emptyDay: t("activityEmptyDay"),
            previousDay: t("previousDay"),
            nextDay: t("nextDay"),
            jumpToDate: t("jumpToDate"),
            jumpToday: t("jumpToday"),
            showCancelled: t("showCancelled"),
          }}
        />
      </div>
    </AdminWorkspace>
  );
}

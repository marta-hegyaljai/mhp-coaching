import {getTranslations, setRequestLocale} from "next-intl/server";

import {ActivityChannelFilter} from "@/features/admin/activity/components/channel-filter";
import {ActivityList} from "@/features/admin/activity/components/activity-list";
import {ActivityToolbar} from "@/features/admin/activity/components/activity-toolbar";
import {activityCopy, activityKindLabels} from "@/features/admin/activity/copy";
import {loadActivityFeed} from "@/features/admin/activity/feed";
import {
  activityFilterHref,
  activityHref,
  activityPageHref,
  parseActivityQuery,
} from "@/features/admin/activity/query";
import {ACTIVITY_KINDS} from "@/features/admin/activity/types";
import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {PageHeader} from "@/shared/ui/page-header";
import {Pagination} from "@/shared/ui/pagination";

type AdminOverviewPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{
    when?: string | string[];
    kind?: string | string[];
    q?: string | string[];
    page?: string | string[];
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
  const feed = await loadActivityFeed({query, locale, copy});
  const {entries, total, page, pageCount, pageSize} = feed.page;
  const firstOnPage = (page - 1) * pageSize + 1;

  const emptyMessage =
    query.q !== ""
      ? t("activityEmptySearch")
      : query.when === "today"
        ? t("activityEmptyToday")
        : query.when === "upcoming"
          ? t("activityEmptyUpcoming")
          : t("activityEmptyHistory");

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <AdminSubnav
          current="overview"
          label={t("sectionsNav")}
          labels={adminSectionLabels(t)}
        />
        <PageHeader
          className="mt-6"
          title={t("overviewTitle")}
          intro={t("overviewIntro")}
        />

        <ActivityChannelFilter
          className="mt-8"
          label={t("activityChannels")}
          items={[
            {
              key: "all",
              label: t("filterAll"),
              count: feed.windowTotal,
              href: activityFilterHref(query, {kind: "all"}),
              current: query.kind === "all",
            },
            ...ACTIVITY_KINDS.map((kind) => ({
              key: kind,
              label: kindLabels.filter[kind],
              count: feed.counts[kind],
              href: activityFilterHref(query, {kind}),
              current: query.kind === kind,
            })),
          ]}
        />

        <div className="mt-6">
          <ActivityToolbar
            action={localizedPath(locale, "/admin/overview")}
            query={query}
            labels={{
              windowGroup: t("activityWindowGroup"),
              windows: {
                today: t("activityToday"),
                upcoming: t("activityUpcoming"),
                history: t("activityHistory"),
              },
              filter: t("filter"),
              search: t("activitySearch"),
              searchPlaceholder: t("activitySearchPlaceholder"),
              clear: t("clearFilters"),
            }}
          />

          <p className="mt-3 font-sans text-sm tabular-nums text-ink-muted">
            {t("activityCount", {
              from: firstOnPage,
              to: firstOnPage + entries.length - 1,
              total,
            })}
          </p>

          {entries.length === 0 ? (
            <p className="mt-6 text-sm leading-7 text-ink-muted">{emptyMessage}</p>
          ) : (
            <div className="mt-4">
              <ActivityList
                entries={entries}
                labels={{
                  when: t("activityWhen"),
                  channel: t("activityChannel"),
                  who: t("activityWho"),
                  what: t("activityWhat"),
                  status: t("status"),
                  actions: t("bookingActions"),
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
                }}
              />
            </div>
          )}

          {pageCount > 1 ? (
            <Pagination
              className="mt-6"
              previous={page > 1 ? activityPageHref(query, page - 1) : null}
              next={page < pageCount ? activityPageHref(query, page + 1) : null}
              status={t("pageStatus", {page, pageCount})}
              labels={{previous: t("previous"), next: t("next")}}
            />
          ) : null}
        </div>
      </Section>
    </SiteShell>
  );
}

import {getTranslations, setRequestLocale} from "next-intl/server";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {CallHoursForm} from "@/features/course-calls/components/hours-form";
import {callPersonName, callWhen} from "@/features/course-calls/format";
import {
  adminCallListHref,
  adminCallListHrefForPage,
  adminCallPageSize,
  parseAdminCallQuery,
  type AdminCallTab,
  type AdminCallWhen,
} from "@/features/course-calls/query";
import {listAdminCalls, listAdminInquiries, listCallHours} from "@/features/course-calls/repository";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Button} from "@/shared/ui/button";
import {InputField, SelectField} from "@/shared/ui/field";
import {FilterBar} from "@/shared/ui/filter-bar";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {PageHeader} from "@/shared/ui/page-header";
import {Pagination} from "@/shared/ui/pagination";
import {SegmentedLinks} from "@/shared/ui/segmented-links";
import {StatusLabel, statusRailClass} from "@/shared/ui/status-label";

type AdminCallsPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{
    tab?: string | string[];
    when?: string | string[];
    q?: string | string[];
    page?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdminCallsPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  return buildPageMetadata({
    locale,
    title: t("callsTitle"),
    description: t("callsIntro"),
    hrefForLocale: () => "/admin/calls",
    robots: {index: false, follow: false},
  });
}

export default async function AdminCallsPage({params, searchParams}: AdminCallsPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const query = parseAdminCallQuery(await searchParams);
  await requireAdmin(locale, localizedPath(locale, adminCallListHref(query)));
  const t = await getTranslations("Admin");
  const pageSize = adminCallPageSize();
  const now = new Date();

  const tabItems: Array<{key: AdminCallTab; label: string}> = [
    {key: "agenda", label: t("callsAgenda")},
    {key: "hours", label: t("callsHours")},
    {key: "messages", label: t("callsMessages")},
  ];

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <AdminSubnav
          current="calls"
          label={t("sectionsNav")}
          labels={adminSectionLabels(t)}
        />
        <PageHeader
          className="mt-6"
          title={t("callsTitle")}
          intro={t("callsIntro")}
        />

        <div className="mt-8">
          <SegmentedLinks
            label={t("callsViews")}
            items={tabItems.map((item) => ({
              key: item.key,
              href: adminCallListHref({tab: item.key}),
              label: item.label,
              current: query.tab === item.key,
            }))}
          />
        </div>

        {query.tab === "hours" ? (
          <div className="mt-10">
            <CallHoursForm locale={locale} hours={await listCallHours()} />
          </div>
        ) : null}

        {query.tab === "agenda" ? (
          <Agenda
            locale={locale}
            query={query}
            now={now}
            pageSize={pageSize}
            labels={{
              filter: t("filter"),
              search: t("callsSearch"),
              searchPlaceholder: t("callsSearchPlaceholder"),
              when: t("callsWhen"),
              upcoming: t("callsUpcoming"),
              past: t("callsPast"),
              all: t("filterAll"),
              empty: t("callsEmpty"),
              scheduled: t("callStatusScheduled"),
              cancelled: t("callStatusCancelled"),
              previous: t("previous"),
              next: t("next"),
            }}
          />
        ) : null}

        {query.tab === "messages" ? (
          <Messages
            locale={locale}
            query={query}
            pageSize={pageSize}
            labels={{
              filter: t("filter"),
              search: t("callsSearch"),
              searchPlaceholder: t("inquirySearchPlaceholder"),
              empty: t("inquiriesEmpty"),
              previous: t("previous"),
              next: t("next"),
            }}
          />
        ) : null}
      </Section>
    </SiteShell>
  );
}

async function Agenda({
  locale,
  query,
  now,
  pageSize,
  labels,
}: {
  locale: AppLocale;
  query: ReturnType<typeof parseAdminCallQuery>;
  now: Date;
  pageSize: number;
  labels: {
    filter: string;
    search: string;
    searchPlaceholder: string;
    when: string;
    upcoming: string;
    past: string;
    all: string;
    empty: string;
    scheduled: string;
    cancelled: string;
    previous: string;
    next: string;
  };
}) {
  const t = await getTranslations("Admin");
  const listing = await listAdminCalls({
    q: query.q || undefined,
    when: query.when,
    now,
    limit: pageSize,
    offset: (query.page - 1) * pageSize,
  });
  const pageCount = Math.max(1, Math.ceil(listing.total / pageSize));
  const whenOptions: Array<{value: AdminCallWhen; label: string}> = [
    {value: "upcoming", label: labels.upcoming},
    {value: "past", label: labels.past},
    {value: "all", label: labels.all},
  ];

  return (
    <div className="mt-10">
      <FilterBar
        action={localizedPath(locale, "/admin/calls")}
        label={labels.filter}
        columnsClassName="sm:grid-cols-[minmax(0,1fr)_11rem_auto]"
        actions={
          <Button type="submit" variant="secondary">
            {labels.filter}
          </Button>
        }
      >
        <input type="hidden" name="tab" value="agenda" />
        <InputField
          id="q"
          name="q"
          label={labels.search}
          defaultValue={query.q}
          placeholder={labels.searchPlaceholder}
          size="sm"
        />
        <SelectField id="when" name="when" label={labels.when} defaultValue={query.when} size="sm">
          {whenOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
      </FilterBar>

      {listing.rows.length === 0 ? (
        <p className="mt-8 text-sm leading-7 text-ink-muted">{labels.empty}</p>
      ) : (
        <ul className="mt-8 grid gap-3">
          {listing.rows.map((call) => {
            const when = callWhen(call.startsAt, call.endsAt, locale);
            return (
              <li key={call.id}>
                <Link
                  href={{pathname: "/admin/calls/[id]", params: {id: call.id}}}
                  className={`flex flex-col gap-2 rounded-panel border border-ink bg-white px-5 py-4 transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:flex-row sm:items-center sm:justify-between ${statusRailClass(call.status === "SCHEDULED" ? "ok" : "stop")}`}
                >
                  <div className="min-w-0">
                    <StatusLabel tone={call.status === "SCHEDULED" ? "ok" : "stop"}>
                      {call.status === "SCHEDULED" ? labels.scheduled : labels.cancelled}
                    </StatusLabel>
                    <p className="mt-2 font-medium text-ink">
                      {callPersonName(call.firstName, call.lastName)}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {call.courseTitle ?? t("callGeneral")}
                    </p>
                  </div>
                  <p className="shrink-0 font-sans text-sm tabular-nums text-ink-muted">
                    {when.dateLabel}
                    <span className="mx-2">·</span>
                    {when.timeLabel}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        className="mt-4"
        previous={
          query.page > 1 ? adminCallListHrefForPage(query, query.page - 1) : null
        }
        next={
          query.page < pageCount ? adminCallListHrefForPage(query, query.page + 1) : null
        }
        status={t("pageStatus", {page: query.page, pageCount})}
        labels={{previous: labels.previous, next: labels.next}}
      />
    </div>
  );
}

async function Messages({
  locale,
  query,
  pageSize,
  labels,
}: {
  locale: AppLocale;
  query: ReturnType<typeof parseAdminCallQuery>;
  pageSize: number;
  labels: {
    filter: string;
    search: string;
    searchPlaceholder: string;
    empty: string;
    previous: string;
    next: string;
  };
}) {
  const t = await getTranslations("Admin");
  const listing = await listAdminInquiries({
    q: query.q || undefined,
    limit: pageSize,
    offset: (query.page - 1) * pageSize,
  });
  const pageCount = Math.max(1, Math.ceil(listing.total / pageSize));

  return (
    <div className="mt-10">
      <FilterBar
        action={localizedPath(locale, "/admin/calls")}
        label={labels.filter}
        columnsClassName="sm:grid-cols-[minmax(0,1fr)_auto]"
        actions={
          <Button type="submit" variant="secondary">
            {labels.filter}
          </Button>
        }
      >
        <input type="hidden" name="tab" value="messages" />
        <InputField
          id="q"
          name="q"
          label={labels.search}
          defaultValue={query.q}
          placeholder={labels.searchPlaceholder}
          size="sm"
        />
      </FilterBar>

      {listing.rows.length === 0 ? (
        <p className="mt-8 text-sm leading-7 text-ink-muted">{labels.empty}</p>
      ) : (
        <ul className="mt-8 grid gap-3">
          {listing.rows.map((inquiry) => (
            <li key={inquiry.id}>
              <Link
                href={{pathname: "/admin/calls/messages/[id]", params: {id: inquiry.id}}}
                className={`block rounded-panel border border-ink bg-white px-5 py-4 transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${statusRailClass("gold")}`}
              >
                <p className="font-medium text-ink">
                  {callPersonName(inquiry.firstName, inquiry.lastName)}
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  {inquiry.courseTitle ?? t("callGeneral")}
                </p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-muted">
                  {inquiry.message}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        className="mt-4"
        previous={
          query.page > 1 ? adminCallListHrefForPage(query, query.page - 1) : null
        }
        next={
          query.page < pageCount ? adminCallListHrefForPage(query, query.page + 1) : null
        }
        status={t("pageStatus", {page: query.page, pageCount})}
        labels={{previous: labels.previous, next: labels.next}}
      />
    </div>
  );
}

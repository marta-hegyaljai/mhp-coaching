import {getTranslations, setRequestLocale} from "next-intl/server";

import {AdminWorkspace} from "@/features/admin/components/admin-workspace";
import {requireAdmin} from "@/features/auth/require";
import {listAdminAvailabilityRequests} from "@/features/rooms/availability-requests";
import {RequestCard} from "@/features/rooms/components/request-card";
import {assertNoPrivateNoteMaterial} from "@/features/rooms/privacy";
import {
  ADMIN_REQUEST_STATUSES,
  adminRequestListHref,
  adminRequestListHrefForPage,
  parseAdminRequestQuery,
  type AdminRequestStatusFilter,
} from "@/features/rooms/request-query";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Button} from "@/shared/ui/button";
import {InputField, SelectField} from "@/shared/ui/field";
import {FilterBar} from "@/shared/ui/filter-bar";
import {Pagination} from "@/shared/ui/pagination";
import {WorkspacePage} from "@/shared/ui/workspace-page";

type AdminRequestsPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{q?: string | string[]; status?: string | string[]; page?: string | string[]}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdminRequestsPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  return buildPageMetadata({
    locale,
    title: t("adminRequestsTitle"),
    description: t("adminRequestsIntro"),
    hrefForLocale: () => "/admin/requests",
    robots: {index: false, follow: false},
  });
}

export default async function AdminRequestsPage({params, searchParams}: AdminRequestsPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const query = parseAdminRequestQuery(await searchParams);
  const user = await requireAdmin(locale, localizedPath(locale, adminRequestListHref(query)));
  const t = await getTranslations("Admin");
  const rooms = await getTranslations("Rooms");
  const listing = await listAdminAvailabilityRequests(user, query);
  assertNoPrivateNoteMaterial(listing);
  const statusLabels: Record<AdminRequestStatusFilter, string> = {
    all: t("filterAll"),
    OPEN: t("filterOpen"),
    RESOLVED: t("filterResolved"),
    DECLINED: t("filterDeclined"),
  };

  return (
    <AdminWorkspace locale={locale} current="requests">
      <WorkspacePage
        title={t("adminRequestsTitle")}
        intro={t("adminRequestsIntro")}
      >
        <div className="mt-6">
          <FilterBar
            action={localizedPath(locale, "/admin/requests")}
            label={t("filter")}
            columnsClassName="sm:grid-cols-[minmax(0,1fr)_11rem_auto]"
            actions={
              <>
                <Button type="submit" variant="secondary">
                  {t("filter")}
                </Button>
                <Link
                  href="/admin/requests"
                  className="text-sm underline-offset-4 hover:underline"
                >
                  {t("clearFilters")}
                </Link>
              </>
            }
          >
            <InputField
              id="request-search"
              name="q"
              type="search"
              size="sm"
              label={t("searchRequests")}
              defaultValue={query.q}
              autoComplete="off"
            />
            <SelectField
              id="request-status"
              name="status"
              size="sm"
              label={t("status")}
              defaultValue={query.status}
            >
              {ADMIN_REQUEST_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </SelectField>
          </FilterBar>

          <p className="mt-4 font-sans text-sm tabular-nums text-ink-muted">
            {t("requestCount", {shown: listing.rows.length, total: listing.total})}
          </p>

          {listing.rows.length === 0 ? (
            <p className="mt-6 text-sm leading-7 text-ink-muted">{t("noAdminRequests")}</p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listing.rows.map((request) => (
                <li key={request.id}>
                  <RequestCard
                    request={request}
                    locale={locale}
                    href={{pathname: "/admin/requests/[id]", params: {id: request.id}}}
                    statusLabel={statusLabels[request.status]}
                    roomLabel={request.preferredRoomName ?? rooms("anyRoom")}
                    ownerLabel={`${request.owner.firstName} ${request.owner.lastName} · ${request.owner.email}`}
                  />
                </li>
              ))}
            </ul>
          )}

          {listing.pageCount > 1 ? (
            <Pagination
              className="mt-6"
              previous={
                listing.page > 1
                  ? adminRequestListHrefForPage(query, listing.page - 1)
                  : null
              }
              next={
                listing.page < listing.pageCount
                  ? adminRequestListHrefForPage(query, listing.page + 1)
                  : null
              }
              status={t("pageStatus", {page: listing.page, pageCount: listing.pageCount})}
              labels={{previous: t("previous"), next: t("next")}}
            />
          ) : null}
        </div>
      </WorkspacePage>
    </AdminWorkspace>
  );
}

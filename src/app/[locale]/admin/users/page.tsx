import {getTranslations, setRequestLocale} from "next-intl/server";

import {AdminWorkspace} from "@/features/admin/components/admin-workspace";
import {InviteUserDialog} from "@/features/admin/components/invite-user-dialog";
import {UserListFilters} from "@/features/admin/components/user-filters";
import {UserListPagination} from "@/features/admin/components/user-pagination";
import {AdminUserTable} from "@/features/admin/components/user-table";
import {parseUserListQuery, userListHref} from "@/features/admin/user-list-query";
import {toAdminUserView} from "@/features/admin/user-view";
import {listUsersPage} from "@/features/auth/repository";
import {requireAdmin} from "@/features/auth/require";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {WorkspacePage} from "@/shared/ui/workspace-page";

type AdminUsersPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    access?: string | string[];
    page?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdminUsersPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});

  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("intro"),
    hrefForLocale: () => "/admin/users",
    robots: {index: false, follow: false},
  });
}

export default async function AdminUsersPage({params, searchParams}: AdminUsersPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const query = parseUserListQuery(await searchParams);
  await requireAdmin(locale, localizedPath(locale, userListHref(query)));
  const t = await getTranslations("Admin");
  const listing = await listUsersPage(query);
  const users = listing.users.map(toAdminUserView);
  const hasFilters = Boolean(query.q || query.status !== "all" || query.access !== "all");

  return (
    <AdminWorkspace locale={locale} current="users">
      <WorkspacePage
        title={t("title")}
        intro={t("intro")}
      >
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{t("identityNote")}</p>
        <p className="mt-3 text-sm">
          <Link href="/staff/bookings" className="underline-offset-4 hover:underline">
            {t("bookingsLink")}
          </Link>
        </p>

        <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-panel border border-ink bg-white">
          <div className="flex flex-wrap items-start justify-between gap-4 px-4 py-4">
            <div className="min-w-0">
              <h2 className="font-serif text-subheading">{t("listTitle")}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-muted">{t("listIntro")}</p>
            </div>
            <InviteUserDialog locale={locale} />
          </div>

          <div className="border-t border-line px-4 py-3">
            <UserListFilters
              locale={locale}
              query={query}
              frame="inline"
              labels={{
                search: t("search"),
                searchPlaceholder: t("searchPlaceholder"),
                status: t("status"),
                access: t("accessLegend"),
                filter: t("filter"),
                clear: t("clearFilters"),
                statusAll: t("statusAll"),
                statusActive: t("statusActive"),
                statusPending: t("statusPending"),
                statusDisabled: t("statusDisabled"),
                accessAll: t("accessAll"),
                accessAdmin: t("grantAdmin"),
                accessRooms: t("grantRooms"),
                accessNone: t("accessNone"),
              }}
            />
          </div>

          <p className="border-t border-line px-4 py-3 font-sans text-sm tabular-nums text-ink-muted">
            {t("resultCount", {shown: users.length, total: listing.total})}
          </p>

          <div className="border-t border-line">
            <AdminUserTable
              embedded
              users={users}
              labels={{
                name: t("name"),
                email: t("email"),
                status: t("status"),
                access: t("accessLegend"),
                empty: hasFilters ? t("noMatches") : t("empty"),
                manage: t("manage"),
                statusActive: t("statusActive"),
                statusDisabled: t("statusDisabled"),
                statusPending: t("statusPending"),
                accessAdmin: t("grantAdmin"),
                accessRooms: t("grantRooms"),
                accessUser: t("roleUser"),
              }}
            />
          </div>

          <div className="border-t border-line px-4 pb-4">
            <UserListPagination
              query={{...query, page: listing.page}}
              page={listing.page}
              pageCount={listing.total === 0 ? 1 : listing.pageCount}
              className="border-t-0 pt-4"
              labels={{
                previous: t("previous"),
                next: t("next"),
                pageStatus: t("pageStatus", {
                  page: listing.page,
                  pageCount: listing.pageCount,
                }),
              }}
            />
          </div>
        </div>
      </WorkspacePage>
    </AdminWorkspace>
  );
}

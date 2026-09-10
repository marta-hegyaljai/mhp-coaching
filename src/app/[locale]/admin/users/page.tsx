import {getTranslations, setRequestLocale} from "next-intl/server";

import {InviteUserForm} from "@/features/admin/components/invite-form";
import {UserListFilters} from "@/features/admin/components/user-filters";
import {UserListPagination} from "@/features/admin/components/user-pagination";
import {AdminUserTable} from "@/features/admin/components/user-table";
import {parseUserListQuery, userListHref} from "@/features/admin/user-list-query";
import {toAdminUserView} from "@/features/admin/user-view";
import {listUsersPage} from "@/features/auth/repository";
import {requireAdmin} from "@/features/auth/require";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

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
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="mt-3 font-serif text-heading">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">{t("intro")}</p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">{t("identityNote")}</p>
        <p className="mt-3 text-sm">
          <Link href="/staff/bookings" className="underline-offset-4 hover:underline">
            {t("bookingsLink")}
          </Link>
        </p>

        <div className="mt-10">
          <h2 className="font-serif text-subheading">{t("listTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">{t("listIntro")}</p>
          <div className="mt-6">
            <UserListFilters
              locale={locale}
              query={query}
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
          <p className="mt-4 text-sm text-ink-muted">
            {t("resultCount", {shown: users.length, total: listing.total})}
          </p>
          <div className="mt-4">
            <AdminUserTable
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
          <UserListPagination
            query={{...query, page: listing.page}}
            page={listing.page}
            pageCount={listing.total === 0 ? 1 : listing.pageCount}
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

        <div className="mt-16">
          <h2 className="font-serif text-subheading">{t("invite")}</h2>
          <div className="mt-6">
            <InviteUserForm locale={locale} />
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}

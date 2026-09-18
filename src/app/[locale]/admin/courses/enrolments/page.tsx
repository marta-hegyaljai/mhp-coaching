import {getTranslations, setRequestLocale} from "next-intl/server";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {listCourseEnrolments} from "@/features/bookings/repository";
import {
  ADMIN_ENROLMENT_PAGE_SIZE,
  adminEnrolmentListHref,
  adminEnrolmentListHrefForPage,
  paginateAdminEnrolments,
  parseAdminEnrolmentQuery,
} from "@/features/courses/admin-enrolment-query";
import {
  CatalogueEnrolmentFilters,
  CourseEnrolmentTable,
} from "@/features/courses/components/admin/enrolments";
import {enrolmentStatusLabels} from "@/features/courses/enrolment-status-labels";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {BackLink} from "@/shared/ui/back-link";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {PageHeader} from "@/shared/ui/page-header";
import {Pagination} from "@/shared/ui/pagination";

type AdminEnrolmentsPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{
    q?: string | string[];
    cancelled?: string | string[];
    page?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdminEnrolmentsPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});

  return buildPageMetadata({
    locale,
    title: t("coursesEnrolmentsIndexTitle"),
    description: t("coursesEnrolmentsIndexIntro"),
    hrefForLocale: () => "/admin/courses/enrolments",
    robots: {index: false, follow: false},
  });
}

export default async function AdminEnrolmentsPage({
  params,
  searchParams,
}: AdminEnrolmentsPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const query = parseAdminEnrolmentQuery(await searchParams);
  await requireAdmin(locale, localizedPath(locale, adminEnrolmentListHref(query)));
  const t = await getTranslations("Admin");
  const auth = await getTranslations("Auth");

  const bookings = await listCourseEnrolments({
    q: query.q || undefined,
    excludeCancelled: !query.showCancelled,
  });
  const listing = paginateAdminEnrolments(bookings, query.page, ADMIN_ENROLMENT_PAGE_SIZE);
  const statusLabels = enrolmentStatusLabels({auth, admin: t});

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <AdminSubnav
          current="courses"
          label={t("sectionsNav")}
          labels={adminSectionLabels(t)}
        />
        <BackLink href="/admin/courses" className="mt-6">
          {t("coursesBack")}
        </BackLink>
        <PageHeader
          className="mt-5"
          title={t("coursesEnrolmentsIndexTitle")}
          intro={t("coursesEnrolmentsIndexIntro")}
        />

        <div className="mt-8 lg:sticky lg:top-16 lg:z-20">
          <CatalogueEnrolmentFilters
            locale={locale}
            query={query}
            labels={{
              search: t("search"),
              searchPlaceholder: t("coursesEnrolmentSearch"),
              showCancelled: t("showCancelled"),
              filter: t("filter"),
              clear: t("clearFilters"),
            }}
          />
        </div>

        <p className="mt-4 text-sm text-ink-muted">
          {t("coursesEnrolmentsResultCount", {
            shown: listing.items.length,
            total: listing.total,
          })}
        </p>

        <div className="mt-5">
          <CourseEnrolmentTable
            bookings={listing.items}
            locale={locale}
            statusLabels={statusLabels}
            showCourse
            labels={{
              name: t("name"),
              course: t("coursesEnrolmentCourse"),
              dateOfBirth: t("coursesDateOfBirth"),
              email: t("email"),
              phone: t("coursesPhone"),
              address: t("coursesAddress"),
              session: t("coursesSessionFilter"),
              amount: t("coursesAmount"),
              status: t("status"),
              created: t("coursesCreated"),
              empty: t("coursesEnrolmentsEmpty"),
            }}
          />
        </div>

        {listing.pageCount > 1 ? (
          <Pagination
            className="mt-4"
            previous={
              listing.page > 1
                ? adminEnrolmentListHrefForPage(query, listing.page - 1)
                : null
            }
            next={
              listing.page < listing.pageCount
                ? adminEnrolmentListHrefForPage(query, listing.page + 1)
                : null
            }
            status={t("pageStatus", {
              page: listing.page,
              pageCount: listing.pageCount,
            })}
            labels={{previous: t("previous"), next: t("next")}}
          />
        ) : null}
      </Section>
    </SiteShell>
  );
}

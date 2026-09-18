import {getTranslations, setRequestLocale} from "next-intl/server";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {listCourseEnrolments} from "@/features/bookings/repository";
import {
  buildCourseListEntries,
  filterCourseListEntries,
  isCourseListFiltered,
  summarizeCourseList,
} from "@/features/courses/admin-list";
import {
  parseCourseListQuery,
  courseListHref,
} from "@/features/courses/admin-query";
import {CourseListFilters} from "@/features/courses/components/admin/course-filters";
import {CatalogueOverview} from "@/features/courses/components/admin/course-list/catalogue-overview";
import {CourseList} from "@/features/courses/components/admin/course-list/course-list";
import {loadCatalogueCourses} from "@/features/courses/live";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {WorkspacePage} from "@/shared/ui/workspace-page";

type AdminCoursesPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
    published?: string | string[];
    upcoming?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdminCoursesPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});

  return buildPageMetadata({
    locale,
    title: t("coursesTitle"),
    description: t("coursesIntro"),
    hrefForLocale: () => "/admin/courses",
    robots: {index: false, follow: false},
  });
}

export default async function AdminCoursesPage({params, searchParams}: AdminCoursesPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const query = parseCourseListQuery(await searchParams);
  await requireAdmin(locale, localizedPath(locale, courseListHref(query)));
  const t = await getTranslations("Admin");

  const catalogue = await loadCatalogueCourses();
  const enrolments = await listCourseEnrolments({excludeCancelled: true});
  const enrolmentCounts = new Map<string, number>();
  for (const booking of enrolments) {
    enrolmentCounts.set(booking.courseId, (enrolmentCounts.get(booking.courseId) ?? 0) + 1);
  }

  const entries = buildCourseListEntries(catalogue, enrolmentCounts);
  const summary = summarizeCourseList(entries);
  const visible = filterCourseListEntries(entries, query);
  const canReorder = !isCourseListFiltered(query);

  const categories = {
    foundation: t("coursesCategory_foundation"),
    advanced: t("coursesCategory_advanced"),
    medical: t("coursesCategory_medical"),
    workshop: t("coursesCategory_workshop"),
    supervision: t("coursesCategory_supervision"),
  };

  return (
    <SiteShell locale={locale} footerCta={null}>
      <WorkspacePage
        eyebrow={t("eyebrow")}
        nav={
          <AdminSubnav
            current="courses"
            label={t("sectionsNav")}
            labels={adminSectionLabels(t)}
          />
        }
        title={t("coursesTitle")}
        intro={t("coursesIntro")}
      >

        <CatalogueOverview
          summary={summary}
          labels={{
            total: t("coursesOverviewTotal"),
            published: t("coursesOverviewPublished"),
            withoutUpcoming: t("coursesOverviewNoUpcoming"),
            enrolments: t("coursesOverviewEnrolments"),
          }}
        />

        {/* Filters lead the list they narrow. They only pin on wide screens,
            where the bar is one row and cannot cover the results. */}
        <div className="mt-8 lg:sticky lg:top-16 lg:z-20">
          <CourseListFilters
            locale={locale}
            query={query}
            labels={{
              search: t("search"),
              searchPlaceholder: t("coursesSearchPlaceholder"),
              category: t("coursesCategory"),
              published: t("coursesPublished"),
              upcoming: t("coursesUpcoming"),
              filter: t("filter"),
              clear: t("clearFilters"),
              categoryAll: t("coursesCategoryAll"),
              publishedAll: t("coursesPublishedAll"),
              publishedYes: t("coursesPublishedYes"),
              publishedNo: t("coursesPublishedNo"),
              upcomingAll: t("coursesUpcomingAll"),
              upcomingYes: t("coursesUpcomingYes"),
              upcomingNo: t("coursesUpcomingNo"),
              categories,
            }}
          />
        </div>

        <CourseList
          entries={visible}
          total={summary.total}
          locale={locale}
          canReorder={canReorder}
          labels={{
            resultCount: t("coursesResultCount", {
              shown: visible.length,
              total: summary.total,
            }),
            orderHint: t("coursesOrderIntro"),
            orderLocked: t("coursesOrderLocked"),
            empty: t("coursesEmpty"),
            manage: t("coursesManage"),
            programme: t("coursesFormat_programme"),
            unpublished: t("coursesPublishedNo"),
            noUpcoming: t("coursesNoUpcoming"),
            sessionCount: (count) => t("coursesSessionCount", {count}),
            enrolmentCount: (count) => t("coursesEnrolmentCount", {count}),
            categories,
          }}
        />
      </WorkspacePage>
    </SiteShell>
  );
}

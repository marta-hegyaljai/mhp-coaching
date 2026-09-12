import {getTranslations, setRequestLocale} from "next-intl/server";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {listCourseEnrolments} from "@/features/bookings/repository";
import {
  parseCourseListQuery,
  courseListHref,
} from "@/features/courses/admin-query";
import {CourseListFilters} from "@/features/courses/components/admin/course-filters";
import {loadCatalogueCourses} from "@/features/courses/live";
import {formatCourseDateRange} from "@/features/courses/dates";
import {formatChf} from "@/features/payments/money";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Price} from "@/shared/ui/price";
import {StatusLabel} from "@/shared/ui/status-label";

type AdminCoursesPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
    published?: string | string[];
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
  const needle = query.q.toLowerCase();
  const filtered = catalogue.filter((course) => {
    if (query.category !== "all" && course.category !== query.category) {
      return false;
    }
    const published = course.published !== false;
    if (query.published === "yes" && !published) {
      return false;
    }
    if (query.published === "no" && published) {
      return false;
    }
    if (!needle) {
      return true;
    }
    const haystack = [
      course.id,
      ...Object.values(course.title),
      ...Object.values(course.slug),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
  const enrolments = await listCourseEnrolments({});
  const counts = new Map<string, number>();
  for (const booking of enrolments) {
    counts.set(booking.courseId, (counts.get(booking.courseId) ?? 0) + 1);
  }

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <AdminSubnav
          current="courses"
          label={t("sectionsNav")}
          labels={adminSectionLabels(t)}
        />
        <h1 className="mt-3 font-serif text-heading">{t("coursesTitle")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">{t("coursesIntro")}</p>

        <div className="mt-10">
          <CourseListFilters
            locale={locale}
            query={query}
            labels={{
              search: t("search"),
              searchPlaceholder: t("coursesSearchPlaceholder"),
              category: t("coursesCategory"),
              published: t("coursesPublished"),
              filter: t("filter"),
              clear: t("clearFilters"),
              categoryAll: t("coursesCategoryAll"),
              publishedAll: t("coursesPublishedAll"),
              publishedYes: t("coursesPublishedYes"),
              publishedNo: t("coursesPublishedNo"),
              categories: {
                foundation: t("coursesCategory_foundation"),
                advanced: t("coursesCategory_advanced"),
                medical: t("coursesCategory_medical"),
                workshop: t("coursesCategory_workshop"),
              },
            }}
          />
        </div>

        {filtered.length === 0 ? (
          <p className="mt-8 text-sm text-ink-muted">{t("coursesEmpty")}</p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((course) => {
              const nextDate = course.dates
                .filter((date) => date.active)
                .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
              const enrolmentCount = counts.get(course.id) ?? 0;

              return (
                <li key={course.id} className="flex h-full flex-col rounded-panel border border-ink bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <StatusLabel tone={course.published !== false ? "strong" : "muted"}>
                      {course.published !== false
                        ? t("coursesPublishedYes")
                        : t("coursesPublishedNo")}
                    </StatusLabel>
                    <span className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-ink-subtle">
                      {t(`coursesCategory_${course.category}`)}
                    </span>
                  </div>
                  <h2 className="mt-3 font-serif text-subheading leading-tight">
                    {course.title[locale]}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {course.shortDescription[locale]}
                  </p>
                  <p className="mt-4 font-sans text-sm tabular-nums text-ink">
                    <Price>{formatChf(course.priceChf, locale)}</Price>
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {t("coursesSessionCount", {count: course.dates.length})}
                    {" · "}
                    {t("coursesEnrolmentCount", {count: enrolmentCount})}
                  </p>
                  {nextDate ? (
                    <p className="mt-1 text-sm text-ink-muted">
                      {formatCourseDateRange(nextDate, locale)}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-ink-muted">{t("coursesNoUpcoming")}</p>
                  )}
                  <p className="mt-5">
                    <Link
                      href={{pathname: "/admin/courses/[id]", params: {id: course.id}}}
                      className="text-sm font-semibold underline-offset-4 hover:underline"
                    >
                      {t("coursesManage")}
                    </Link>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </SiteShell>
  );
}

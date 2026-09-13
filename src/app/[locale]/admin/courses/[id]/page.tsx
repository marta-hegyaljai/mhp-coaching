import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import type {Booking} from "@/db/schema";
import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {listCourseEnrolments} from "@/features/bookings/repository";
import {
  parseCourseRecordQuery,
  courseDetailHref,
} from "@/features/courses/admin-query";
import {AdminCourseForm} from "@/features/courses/components/admin/course-form";
import {CourseRecordNav} from "@/features/courses/components/admin/course-record-nav";
import {
  CourseEnrolmentFilters,
  CourseEnrolmentTable,
} from "@/features/courses/components/admin/enrolments";
import {AdminSessionList} from "@/features/courses/components/admin/sessions/session-list";
import {todayIsoInZurich} from "@/features/courses/dates";
import {loadCatalogueCourses, loadCourseById} from "@/features/courses/live";
import {splitCatalogueByFormat} from "@/features/courses/programme";
import {isCoursePublished, isProgrammeCourse, type Course} from "@/features/courses/types";
import {formatChf} from "@/features/payments/money";
import {listWaitlistForCourse} from "@/features/waitlist/repository";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {BackLink} from "@/shared/ui/back-link";
import {Chip} from "@/shared/ui/chip";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Price} from "@/shared/ui/price";

type AdminCourseDetailPageProps = {
  params: Promise<{locale: AppLocale; id: string}>;
  searchParams: Promise<{
    q?: string | string[];
    session?: string | string[];
    status?: string | string[];
    tab?: string | string[];
    show?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdminCourseDetailPageProps) {
  const {locale, id} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  const course = await loadCourseById(id);

  return buildPageMetadata({
    locale,
    title: course ? `${t("coursesManage")} — ${course.title[locale]}` : t("coursesTitle"),
    description: t("coursesIntro"),
    hrefForLocale: () => ({pathname: "/admin/courses/[id]", params: {id}}),
    robots: {index: false, follow: false},
  });
}

export default async function AdminCourseDetailPage({
  params,
  searchParams,
}: AdminCourseDetailPageProps) {
  const {locale, id} = await params;
  const query = parseCourseRecordQuery(await searchParams);
  setRequestLocale(locale);
  await requireAdmin(locale, localizedPath(locale, courseDetailHref(id, query)));
  const t = await getTranslations("Admin");
  const auth = await getTranslations("Auth");
  const course = await loadCourseById(id);

  if (!course) {
    notFound();
  }

  const [catalogue, allEnrolments, waitlist, bookings] = await Promise.all([
    query.tab === "details" ? loadCatalogueCourses() : Promise.resolve<Course[]>([]),
    listCourseEnrolments({courseId: course.id}),
    listWaitlistForCourse(course.id),
    query.tab === "enrolments"
      ? listCourseEnrolments({
          courseId: course.id,
          courseDateId: query.session || undefined,
          status: query.status,
          q: query.q || undefined,
        })
      : Promise.resolve<Booking[]>([]),
  ]);
  const selectableModules = splitCatalogueByFormat(catalogue).modules.filter(
    (item) => item.id !== course.id,
  );
  const enrolmentCounts: Record<string, number> = {};
  for (const booking of allEnrolments) {
    enrolmentCounts[booking.courseDateId] =
      (enrolmentCounts[booking.courseDateId] ?? 0) + 1;
  }

  const statusLabels = {
    PAID: auth("status.PAID"),
    PENDING: auth("status.PENDING"),
    LEAD: auth("status.LEAD"),
    REFUNDED: auth("status.REFUNDED"),
    FAILED: t("coursesStatusFailed"),
    CANCELLED: t("coursesStatusCancelled"),
  };

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
        <h1 className="mt-5 font-serif text-heading">{course.title[locale]}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {!isCoursePublished(course) ? (
            <Chip tone="strong">{t("coursesPublishedNo")}</Chip>
          ) : null}
          {isProgrammeCourse(course) ? <Chip>{t("coursesFormat_programme")}</Chip> : null}
          <Price size="sm">{formatChf(course.priceChf, locale, {compact: true})}</Price>
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-ink-subtle">
            {t(`coursesCategory_${course.category}`)}
          </span>
        </div>

        <CourseRecordNav
          courseId={course.id}
          current={query.tab}
          counts={{
            sessions: course.dates.length,
            enrolments: allEnrolments.length,
            waitlist: waitlist.length,
          }}
          labels={{
            landmark: t("coursesRecordNav"),
            details: t("coursesTabDetails"),
            sessions: t("coursesTabSessions"),
            enrolments: t("coursesTabEnrolments"),
            waitlist: t("coursesTabWaitlist"),
          }}
        />

        <div className="mt-8">
          {query.tab === "details" ? (
            <section>
              <h2 className="font-serif text-subheading">{t("coursesEditTitle")}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
                {t("coursesEditHelp")}
              </p>
              <div className="mt-6">
                <AdminCourseForm
                  course={course}
                  modules={selectableModules}
                  locale={locale}
                />
              </div>
            </section>
          ) : null}

          {query.tab === "sessions" ? (
            <AdminSessionList
              course={course}
              enrolmentCounts={enrolmentCounts}
              today={todayIsoInZurich()}
              locale={locale}
              show={query.show}
            />
          ) : null}

          {query.tab === "enrolments" ? (
            <section className="space-y-5">
              <h2 className="font-serif text-subheading">{t("coursesEnrolmentsTitle")}</h2>
              <p className="max-w-2xl text-sm leading-6 text-ink-muted">
                {t("coursesEnrolmentsHelp")}
              </p>
              <CourseEnrolmentFilters
                locale={locale}
                courseId={course.id}
                query={query}
                sessions={course.dates}
                labels={{
                  search: t("search"),
                  searchPlaceholder: t("coursesEnrolmentSearch"),
                  session: t("coursesSessionFilter"),
                  status: t("status"),
                  allSessions: t("coursesAllSessions"),
                  filter: t("filter"),
                  clear: t("clearFilters"),
                  statusAll: t("filterAll"),
                  statuses: statusLabels,
                }}
              />
              <CourseEnrolmentTable
                bookings={bookings}
                locale={locale}
                statusLabels={statusLabels}
                labels={{
                  name: t("name"),
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
            </section>
          ) : null}

          {query.tab === "waitlist" ? (
            <section className="space-y-4">
              <h2 className="font-serif text-subheading">{t("coursesWaitlistTitle")}</h2>
              {waitlist.length === 0 ? (
                <p className="text-sm text-ink-muted">{t("coursesWaitlistEmpty")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-line text-xs uppercase tracking-[0.14em] text-ink-subtle">
                        <th className="py-3 pr-4 font-medium">{t("name")}</th>
                        <th className="py-3 pr-4 font-medium">{t("email")}</th>
                        <th className="py-3 pr-4 font-medium">{t("coursesPhone")}</th>
                        <th className="py-3 font-medium">{t("coursesCreated")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waitlist.map((entry) => (
                        <tr key={entry.id} className="border-b border-line/70">
                          <td className="py-3 pr-4">
                            {entry.firstName} {entry.lastName}
                          </td>
                          <td className="py-3 pr-4">{entry.email}</td>
                          <td className="py-3 pr-4">{entry.phone}</td>
                          <td className="py-3 font-sans tabular-nums text-ink-muted">
                            {entry.createdAt.toISOString().slice(0, 10)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : null}
        </div>
      </Section>
    </SiteShell>
  );
}

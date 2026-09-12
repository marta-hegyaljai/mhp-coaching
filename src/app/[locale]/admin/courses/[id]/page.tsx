import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {listCourseEnrolments} from "@/features/bookings/repository";
import {
  parseCourseEnrolmentQuery,
  courseDetailHref,
} from "@/features/courses/admin-query";
import {AdminCourseForm} from "@/features/courses/components/admin/course-form";
import {
  CourseEnrolmentFilters,
  CourseEnrolmentTable,
} from "@/features/courses/components/admin/enrolments";
import {
  AdminCreateSessionForm,
  AdminSessionForm,
} from "@/features/courses/components/admin/session-form";
import {loadCourseById} from "@/features/courses/live";
import {listWaitlistForCourse} from "@/features/waitlist/repository";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

type AdminCourseDetailPageProps = {
  params: Promise<{locale: AppLocale; id: string}>;
  searchParams: Promise<{
    q?: string | string[];
    session?: string | string[];
    status?: string | string[];
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
  const query = parseCourseEnrolmentQuery(await searchParams);
  setRequestLocale(locale);
  await requireAdmin(locale, localizedPath(locale, courseDetailHref(id, query)));
  const t = await getTranslations("Admin");
  const auth = await getTranslations("Auth");
  const course = await loadCourseById(id);

  if (!course) {
    notFound();
  }

  const allEnrolments = await listCourseEnrolments({courseId: course.id});
  const bookings = await listCourseEnrolments({
    courseId: course.id,
    courseDateId: query.session || undefined,
    status: query.status,
    q: query.q || undefined,
  });
  const waitlist = await listWaitlistForCourse(course.id);
  const enrolmentCounts = new Map<string, number>();
  for (const booking of allEnrolments) {
    enrolmentCounts.set(
      booking.courseDateId,
      (enrolmentCounts.get(booking.courseDateId) ?? 0) + 1,
    );
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
        <p className="mt-4 text-sm">
          <Link href="/admin/courses" className="underline-offset-4 hover:underline">
            {t("coursesBack")}
          </Link>
        </p>
        <h1 className="mt-3 font-serif text-heading">{course.title[locale]}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
          {t("coursesDetailIntro")}
        </p>

        <div className="mt-10 space-y-12">
          <section>
            <h2 className="font-serif text-subheading">{t("coursesEditTitle")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
              {t("coursesEditHelp")}
            </p>
            <div className="mt-6">
              <AdminCourseForm course={course} />
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="font-serif text-subheading">{t("coursesSessionsTitle")}</h2>
            <p className="max-w-2xl text-sm leading-6 text-ink-muted">
              {t("coursesSessionsHelp")}
            </p>
            {course.dates.length === 0 ? (
              <p className="text-sm text-ink-muted">{t("coursesNoSessions")}</p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {course.dates.map((date) => (
                  <AdminSessionForm
                    key={date.id}
                    courseId={course.id}
                    date={date}
                    enrolmentCount={enrolmentCounts.get(date.id) ?? 0}
                  />
                ))}
              </div>
            )}
            <AdminCreateSessionForm course={course} />
          </section>

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
        </div>
      </Section>
    </SiteShell>
  );
}

import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {BookingForm} from "@/features/bookings/components/booking-form";
import {WaitlistForm} from "@/features/waitlist/components/waitlist-form";
import {courseLocaleHrefs} from "@/features/courses/locale-hrefs";
import {
  getBookableDates,
  getCourseBySlug,
  getCourseStaticParams,
} from "@/features/courses/queries";
import {BreadcrumbTrail} from "@/features/seo/breadcrumb-trail";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {redirect} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

type BookPageProps = {
  params: Promise<{locale: AppLocale; slug: string}>;
  searchParams: Promise<{date?: string}>;
};

export function generateStaticParams() {
  return getCourseStaticParams();
}

export async function generateMetadata({params}: BookPageProps) {
  const {locale, slug} = await params;
  const course = getCourseBySlug(slug);
  const t = await getTranslations({locale, namespace: "BookingForm"});

  if (!course) {
    return {};
  }

  return buildPageMetadata({
    locale,
    title: `${t("title")} — ${course.title[locale]}`,
    description: t("intro"),
    hrefForLocale: (targetLocale) => ({
      pathname: "/courses/[slug]/book",
      params: {slug: course.slug[targetLocale]},
    }),
    robots: {index: false, follow: true},
  });
}

export default async function BookCoursePage({
  params,
  searchParams,
}: BookPageProps) {
  const {locale, slug} = await params;
  const {date} = await searchParams;
  setRequestLocale(locale);
  const course = getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  if (course.slug[locale] !== slug) {
    redirect({
      href: {
        pathname: "/courses/[slug]/book",
        params: {slug: course.slug[locale]},
      },
      locale,
    });
  }

  const t = await getTranslations("BookingForm");
  const waitlistT = await getTranslations("WaitlistForm");
  const coursesT = await getTranslations("CoursesPage");
  const courseT = await getTranslations("CourseDetail");
  const navT = await getTranslations("Nav");
  const dates = getBookableDates(course);

  return (
    <SiteShell
      locale={locale}
      hreflangs={courseLocaleHrefs("/courses/[slug]/book", course)}
      footerCta={null}
    >
      <Section size="sm" className="pt-8 pb-16 sm:pb-24">
        <BreadcrumbTrail
          label={navT("breadcrumb")}
          items={[
            {name: coursesT("breadcrumbHome"), path: localizedPath(locale, "/")},
            {
              name: courseT("breadcrumbCourses"),
              path: localizedPath(locale, "/courses"),
            },
            {
              name: course.title[locale],
              path: localizedPath(locale, {
                pathname: "/courses/[slug]",
                params: {slug: course.slug[locale]},
              }),
            },
            {
              name: t("title"),
              path: localizedPath(locale, {
                pathname: "/courses/[slug]/book",
                params: {slug: course.slug[locale]},
              }),
            },
          ]}
        />

        <div className="mt-8 max-w-2xl">
          <Eyebrow>{course.title[locale]}</Eyebrow>
          <h1 className="mt-4 font-serif text-title">
            {dates.length === 0 ? courseT("waitlistCta") : t("title")}
          </h1>
          <p className="mt-5 text-lead text-ink-muted">
            {dates.length === 0 ? waitlistT("intro") : t("intro")}
          </p>
        </div>

        <div className="mt-10 sm:mt-12">
          {dates.length === 0 ? (
            <WaitlistForm locale={locale} course={course} />
          ) : (
            <BookingForm
              locale={locale}
              course={course}
              dates={dates}
              initialDateId={date}
            />
          )}
        </div>
      </Section>
    </SiteShell>
  );
}

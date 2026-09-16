import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {adviceHref, courseAdvice, parseAdviceQuery} from "@/features/course-calls/advice-route";
import {loadAdviceView} from "@/features/course-calls/advice-view";
import {AdvicePanel} from "@/features/course-calls/components/advice-panel";
import {courseLocaleHrefs} from "@/features/courses/locale-hrefs";
import {loadPublishedCourseBySlug} from "@/features/courses/live";
import {getCourseStaticParams} from "@/features/courses/queries";
import {BreadcrumbTrail} from "@/features/seo/breadcrumb-trail";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {redirect} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

type AdvicePageProps = {
  params: Promise<{locale: AppLocale; slug: string}>;
  searchParams: Promise<{mode?: string; date?: string}>;
};

export function generateStaticParams() {
  return getCourseStaticParams();
}

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdvicePageProps) {
  const {locale, slug} = await params;
  const course = await loadPublishedCourseBySlug(slug);
  const t = await getTranslations({locale, namespace: "CourseAdvice"});

  if (!course) {
    return {};
  }

  return buildPageMetadata({
    locale,
    title: `${t("title")} — ${course.title[locale]}`,
    description: t("intro"),
    hrefForLocale: (targetLocale) => ({
      pathname: "/courses/[slug]/advice",
      params: {slug: course.slug[targetLocale]},
    }),
    robots: {index: false, follow: true},
  });
}

export default async function CourseAdvicePage({params, searchParams}: AdvicePageProps) {
  const {locale, slug} = await params;
  const query = parseAdviceQuery(await searchParams);
  setRequestLocale(locale);
  const course = await loadPublishedCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const target = courseAdvice(course.slug[locale]);

  if (course.slug[locale] !== slug) {
    redirect({href: adviceHref(target, query), locale});
  }

  const t = await getTranslations("CourseAdvice");
  const coursesT = await getTranslations("CoursesPage");
  const courseT = await getTranslations("CourseDetail");
  const navT = await getTranslations("Nav");
  const view = await loadAdviceView(query.date);

  return (
    <SiteShell
      locale={locale}
      hreflangs={courseLocaleHrefs("/courses/[slug]/advice", course)}
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
              path: localizedPath(locale, adviceHref(target, {date: view.selectedDate})),
            },
          ]}
        />

        <div className="mt-8 max-w-2xl">
          <Eyebrow>{course.title[locale]}</Eyebrow>
          <h1 className="mt-4 font-serif text-title">{t("title")}</h1>
          <p className="mt-5 text-lead text-ink-muted">
            {query.mode === "write" ? t("writeIntro") : t("intro")}
          </p>
        </div>

        <AdvicePanel
          locale={locale}
          target={target}
          query={query}
          view={view}
          courseId={course.id}
        />
      </Section>
    </SiteShell>
  );
}

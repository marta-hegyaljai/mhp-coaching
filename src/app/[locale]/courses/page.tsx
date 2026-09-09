import {getTranslations, setRequestLocale} from "next-intl/server";

import {CourseCatalogueLead, CourseCataloguePortrait} from "@/features/courses/components/course-catalogue-masthead";
import {CourseExplorer} from "@/features/courses/components/course-explorer";
import {
  getAdvancedCourses,
  getFoundationCourses,
  getMedicalCourses,
  getPublishedCourses,
  getWorkshopCourses,
} from "@/features/courses/queries";
import type {Course} from "@/features/courses/types";
import {BreadcrumbTrail} from "@/features/seo/breadcrumb-trail";
import {courseListJsonLd} from "@/features/seo/json-ld";
import {JsonLd} from "@/features/seo/json-ld-script";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {Section} from "@/shared/ui/layout";

type CoursesPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{view?: string}>;
};

export async function generateMetadata({params}: CoursesPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "CoursesPage"});

  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("description"),
    hrefForLocale: () => "/courses",
  });
}

export default async function CoursesPage({params, searchParams}: CoursesPageProps) {
  const {locale} = await params;
  const {view} = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("CoursesPage");
  const navT = await getTranslations("Nav");
  const calendarT = await getTranslations("CourseCalendar");

  const groups: Array<{title: string; courses: Course[]}> = [
    {title: t("foundation"), courses: getFoundationCourses()},
    {title: t("advanced"), courses: getAdvancedCourses()},
    {title: t("medical"), courses: getMedicalCourses()},
    {title: t("workshops"), courses: getWorkshopCourses()},
  ].filter((group) => group.courses.length > 0);

  return (
    <SiteShell locale={locale} footerCta={null}>
      <JsonLd data={courseListJsonLd(getPublishedCourses(), locale)} />

      <Section size="sm" className="pt-8 pb-16 sm:pb-24">
        <BreadcrumbTrail
          label={navT("breadcrumb")}
          items={[
            {name: t("breadcrumbHome"), path: localizedPath(locale, "/")},
            {name: t("title"), path: localizedPath(locale, "/courses")},
          ]}
        />
        <CourseExplorer
          locale={locale}
          groups={groups}
          detailsLabel={t("readMore")}
          lead={
            <CourseCatalogueLead
              eyebrow={t("eyebrow")}
              title={t("title")}
              intro={t("intro")}
              courseCount={t("courseCount", {count: getPublishedCourses().length})}
            />
          }
          portrait={<CourseCataloguePortrait imageAlt={t("instructorImageAlt")} />}
          portraitAlt={t("instructorImageAlt")}
          initialView={view === "calendar" ? "calendar" : "grid"}
          labels={{
            search: t("search"),
            searchPlaceholder: t("searchPlaceholder"),
            month: t("monthFilter"),
            allMonths: t("allMonths"),
            gridView: t("gridView"),
            calendarView: t("calendarView"),
            noResults: t("noResults"),
            previousMonth: calendarT("previousMonth"),
            nextMonth: calendarT("nextMonth"),
            emptyDay: calendarT("emptyDay"),
            sessionsOnDay: calendarT("sessionsOnDay"),
            caption: calendarT("caption"),
            awaitingDateLabel: t("waitlistLabel"),
            book: calendarT("book"),
            weekday: {
              mon: calendarT("weekday.mon"),
              tue: calendarT("weekday.tue"),
              wed: calendarT("weekday.wed"),
              thu: calendarT("weekday.thu"),
              fri: calendarT("weekday.fri"),
              sat: calendarT("weekday.sat"),
              sun: calendarT("weekday.sun"),
            },
          }}
        />
      </Section>
    </SiteShell>
  );
}

import {getTranslations, setRequestLocale} from "next-intl/server";

import {AuthNotice} from "@/features/auth/components/auth-field";
import {CourseCatalogueLead, CourseCataloguePortrait} from "@/features/courses/components/course-catalogue-masthead";
import {CourseExplorer} from "@/features/courses/components/course-explorer";
import {buildProgrammeCardModel} from "@/features/courses/components/programme/programme-card-model";
import {loadPublishedCourses} from "@/features/courses/live";
import {resolveProgramme, splitCatalogueByFormat} from "@/features/courses/programme";
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
  searchParams: Promise<{view?: string; verified?: string | string[]}>;
};

export const dynamic = "force-dynamic";

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
  const {view, verified: verifiedParam} = await searchParams;
  const verified = Array.isArray(verifiedParam) ? verifiedParam[0] : verifiedParam;
  setRequestLocale(locale);
  const t = await getTranslations("CoursesPage");
  const authT = await getTranslations("Auth");
  const navT = await getTranslations("Nav");
  const calendarT = await getTranslations("CourseCalendar");

  const publishedCourses = await loadPublishedCourses();
  // Bundled paths leave the category grids and close the page instead.
  const {modules, programmes} = splitCatalogueByFormat(publishedCourses);
  const groups: Array<{title: string; courses: Course[]}> = [
    {title: t("foundation"), courses: modules.filter((course) => course.category === "foundation")},
    {title: t("advanced"), courses: modules.filter((course) => course.category === "advanced")},
    {title: t("medical"), courses: modules.filter((course) => course.category === "medical")},
    {title: t("workshops"), courses: modules.filter((course) => course.category === "workshop")},
  ];
  const programmeCards = programmes.map((programme) =>
    buildProgrammeCardModel(resolveProgramme(programme, publishedCourses), locale, {
      eyebrow: t("programmeEyebrow"),
      includesTitle: t("programmeIncludesTitle"),
      includesCount: (count) => t("programmeIncludesCount", {count}),
      altPrompt: (title) => t("programmeAltPrompt", {title}),
      comparison: (price) => t("programmeComparison", {price}),
      savings: (amount) => t("programmeSavings", {amount}),
      bookCta: t("programmeBookCta"),
      waitlistCta: t("programmeWaitlistCta"),
      awaitingDates: t("waitlistLabel"),
    }),
  );

  return (
    <SiteShell locale={locale} footerCta={null}>
      <JsonLd data={courseListJsonLd(publishedCourses, locale)} />

      <Section size="sm" className="pt-8 pb-16 sm:pb-24">
        <BreadcrumbTrail
          label={navT("breadcrumb")}
          items={[
            {name: t("breadcrumbHome"), path: localizedPath(locale, "/")},
            {name: t("title"), path: localizedPath(locale, "/courses")},
          ]}
        />
        {verified === "1" ? (
          <div className="mb-8 max-w-xl">
            <AuthNotice>{authT("emailConfirmedNotice")}</AuthNotice>
          </div>
        ) : null}
        <CourseExplorer
          locale={locale}
          groups={groups}
          programmes={programmeCards}
          programmeCourses={programmes}
          programmeLabels={{
            title: t("programmeSectionTitle"),
            intro: t("programmeSectionIntro"),
          }}
          categoryLabels={{
            foundation: t("foundation"),
            advanced: t("advanced"),
            medical: t("medical"),
            workshop: t("workshops"),
          }}
          detailsLabel={t("readMore")}
          lead={
            <CourseCatalogueLead
              eyebrow={t("eyebrow")}
              title={t("title")}
              intro={t("intro")}
              courseCount={t("courseCount", {count: publishedCourses.length})}
            />
          }
          portrait={<CourseCataloguePortrait imageAlt={t("instructorImageAlt")} />}
          portraitAlt={t("instructorImageAlt")}
          initialView={view === "calendar" ? "calendar" : "grid"}
          labels={{
            search: t("search"),
            searchPlaceholder: t("searchPlaceholder"),
            searchSuggestions: t("searchSuggestions"),
            searchBrowseAll: t("searchBrowseAll"),
            searchNoSuggestions: t("searchNoSuggestions"),
            viewCourse: t("viewCourse"),
            month: t("monthFilter"),
            allMonths: t("allMonths"),
            gridView: t("gridView"),
            calendarView: t("calendarView"),
            noResults: t("noResults"),
            emptyCategory: t("emptyCategory"),
            programmeLabel: t("programmeEyebrow"),
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

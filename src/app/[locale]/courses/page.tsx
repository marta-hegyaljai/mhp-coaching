import Image from "next/image";
import {getTranslations, setRequestLocale} from "next-intl/server";

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
import {Eyebrow, Section} from "@/shared/ui/layout";

type CoursesPageProps = {
  params: Promise<{locale: AppLocale}>;
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

export default async function CoursesPage({params}: CoursesPageProps) {
  const {locale} = await params;
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

      <Section size="sm" className="pt-8">
        <BreadcrumbTrail
          label={navT("breadcrumb")}
          items={[
            {name: t("breadcrumbHome"), path: localizedPath(locale, "/")},
            {name: t("title"), path: localizedPath(locale, "/courses")},
          ]}
        />
        <div className="relative mt-8 min-h-[22rem] overflow-hidden border border-ink sm:min-h-[30rem]">
          <Image
            src="/images/courses/catalogue-instructor.webp"
            alt={t("instructorImageAlt")}
            fill
            priority
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="object-cover object-[62%_center]"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative flex min-h-[22rem] max-w-3xl flex-col justify-end p-6 text-white sm:min-h-[30rem] sm:p-10 lg:p-14">
            <Eyebrow className="text-white">{t("eyebrow")}</Eyebrow>
            <h1 className="mt-4 font-serif text-title">{t("title")}</h1>
            <p className="mt-5 max-w-2xl text-lead text-white/85">{t("intro")}</p>
          </div>
        </div>
      </Section>

      <Section size="sm" className="pb-16 sm:pb-24">
        <CourseExplorer
          locale={locale}
          groups={groups}
          detailsLabel={t("readMore")}
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

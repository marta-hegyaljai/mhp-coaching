import {getTranslations, setRequestLocale} from "next-intl/server";

import {CourseCalendar} from "@/features/courses/components/course-calendar";
import {getPublishedCalendarSessions} from "@/features/courses/calendar";
import {BreadcrumbTrail} from "@/features/seo/breadcrumb-trail";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

type BookPageProps = {
  params: Promise<{locale: AppLocale}>;
};

export async function generateMetadata({params}: BookPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "QuickBookPage"});

  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("description"),
    hrefForLocale: () => "/book",
  });
}

export default async function QuickBookPage({params}: BookPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("QuickBookPage");
  const coursesT = await getTranslations("CoursesPage");
  const navT = await getTranslations("Nav");
  const calendarT = await getTranslations("CourseCalendar");
  const sessions = getPublishedCalendarSessions(locale);

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-8 pb-16 sm:pb-24">
        <BreadcrumbTrail
          label={navT("breadcrumb")}
          items={[
            {name: coursesT("breadcrumbHome"), path: localizedPath(locale, "/")},
            {name: t("title"), path: localizedPath(locale, "/book")},
          ]}
        />
        <div className="mt-8 max-w-2xl">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h1 className="mt-4 font-serif text-title">{t("title")}</h1>
          <p className="mt-5 text-lead text-ink-muted">{t("intro")}</p>
        </div>
        <div className="mt-10">
          <CourseCalendar
            locale={locale}
            sessions={sessions}
            labels={{
              previousMonth: calendarT("previousMonth"),
              nextMonth: calendarT("nextMonth"),
              emptyDay: calendarT("emptyDay"),
              sessionsOnDay: calendarT("sessionsOnDay"),
              caption: calendarT("caption"),
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
        </div>
      </Section>
    </SiteShell>
  );
}

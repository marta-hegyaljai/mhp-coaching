import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {resolveCheckoutDefaults} from "@/features/auth/contact";
import {getCurrentUser} from "@/features/auth/session";
import {datesWithSlots, loadCallAvailability, slotsForDate} from "@/features/course-calls/availability";
import {CallScheduler} from "@/features/course-calls/components/call-scheduler";
import {InquiryComposer} from "@/features/course-calls/components/inquiry-composer";
import {adviceHref, parseAdviceQuery} from "@/features/course-calls/query";
import {courseLocaleHrefs} from "@/features/courses/locale-hrefs";
import {loadPublishedCourseBySlug} from "@/features/courses/live";
import {getCourseStaticParams} from "@/features/courses/queries";
import {BreadcrumbTrail} from "@/features/seo/breadcrumb-trail";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link, redirect} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {SegmentedLinks} from "@/shared/ui/segmented-links";

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

  if (course.slug[locale] !== slug) {
    redirect({
      href: adviceHref(course.slug[locale], query),
      locale,
    });
  }

  const t = await getTranslations("CourseAdvice");
  const coursesT = await getTranslations("CoursesPage");
  const courseT = await getTranslations("CourseDetail");
  const navT = await getTranslations("Nav");
  const signedInUser = await getCurrentUser();
  const defaults = await resolveCheckoutDefaults(signedInUser);
  const availability = await loadCallAvailability();
  const openDates = datesWithSlots(
    availability.hours,
    availability.booked,
    availability.window,
  );
  const selectedDate =
    query.date &&
    query.date >= availability.window.minDate &&
    query.date <= availability.window.maxDate
      ? query.date
      : (openDates[0] ?? availability.window.minDate);
  const slotsByDate = Object.fromEntries(
    openDates.map((date) => [
      date,
      slotsForDate(date, availability.hours, availability.booked, availability.window).map(
        (slot) => ({time: slot.time, label: slot.time}),
      ),
    ]),
  );
  const callHref = adviceHref(course.slug[locale], {date: selectedDate});
  const writeHref = adviceHref(course.slug[locale], {mode: "write"});

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
              path: localizedPath(locale, callHref),
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

        <div className="mt-8">
          <SegmentedLinks
            label={t("modeLabel")}
            items={[
              {
                key: "call",
                href: callHref,
                label: t("modeCall"),
                current: query.mode !== "write",
              },
              {
                key: "write",
                href: writeHref,
                label: t("modeWrite"),
                current: query.mode === "write",
              },
            ]}
          />
        </div>

        <div className="mt-10 sm:mt-12">
          {query.mode === "write" ? (
            <InquiryComposer
              locale={locale}
              courseId={course.id}
              {...(defaults ? {defaults} : {})}
            />
          ) : (
            <CallScheduler
              locale={locale}
              courseId={course.id}
              courseSlug={course.slug[locale]}
              selectedDate={selectedDate}
              availableDates={openDates}
              slotsByDate={slotsByDate}
              minDate={availability.window.minDate}
              maxDate={availability.window.maxDate}
              {...(defaults ? {defaults} : {})}
            />
          )}
        </div>

        {query.mode === "write" ? (
          <p className="mt-10 max-w-xl text-sm leading-6 text-ink-muted">
            {t("preferCall")}{" "}
            <Link
              href={callHref}
              className="font-medium text-ink underline underline-offset-4"
            >
              {t("modeCall")}
            </Link>
          </p>
        ) : null}
      </Section>
    </SiteShell>
  );
}

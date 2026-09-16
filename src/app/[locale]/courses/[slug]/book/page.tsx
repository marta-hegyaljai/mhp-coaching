import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {BookingForm} from "@/features/bookings/components/booking-form";
import {countOccupyingEnrolmentsByDate} from "@/features/bookings/repository";
import {WaitlistForm} from "@/features/waitlist/components/waitlist-form";
import {CourseAdviceOffer} from "@/features/course-calls/components/advice-offer";
import {checkoutDefaultsFromUser} from "@/features/auth/contact";
import {getCurrentUser} from "@/features/auth/session";
import {courseLocaleHrefs} from "@/features/courses/locale-hrefs";
import {loadPublishedCourseBySlug} from "@/features/courses/live";
import {formatCourseDateRange} from "@/features/courses/dates";
import {
  courseScheduleStatus,
  datesWithOpenSeats,
  isSessionFull,
  nearestFullDate,
} from "@/features/courses/occupancy";
import {courseAvailabilityOf, isComplimentaryCourse} from "@/features/courses/types";
import {
  getBookableDates,
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
  searchParams: Promise<{date?: string; waitlist?: string}>;
};

export function generateStaticParams() {
  return getCourseStaticParams();
}

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: BookPageProps) {
  const {locale, slug} = await params;
  const course = await loadPublishedCourseBySlug(slug);
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
  const {date, waitlist} = await searchParams;
  setRequestLocale(locale);
  const course = await loadPublishedCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  if (course.slug[locale] !== slug) {
    redirect({
      href: {
        pathname: "/courses/[slug]/book",
        params: {slug: course.slug[locale]},
        ...(date || waitlist
          ? {
              query: {
                ...(date ? {date} : {}),
                ...(waitlist ? {waitlist} : {}),
              },
            }
          : {}),
      },
      locale,
    });
  }

  const t = await getTranslations("BookingForm");
  const adviceT = await getTranslations("CourseAdvice");
  const waitlistT = await getTranslations("WaitlistForm");
  const coursesT = await getTranslations("CoursesPage");
  const courseT = await getTranslations("CourseDetail");
  const navT = await getTranslations("Nav");
  const dates = getBookableDates(course);
  const occupancy =
    (await countOccupyingEnrolmentsByDate(dates.map((item) => item.id))) ?? {};
  const courseAvailability = courseAvailabilityOf(course);
  const scheduleStatus = courseScheduleStatus(dates, occupancy, courseAvailability);
  const openDates = datesWithOpenSeats(dates, occupancy, courseAvailability);
  const selectedDate = date ? dates.find((item) => item.id === date) : undefined;
  const selectedFull = Boolean(
    selectedDate && isSessionFull(selectedDate, occupancy, courseAvailability),
  );
  const showClosed = scheduleStatus === "closed";
  const courseLevelWaitlist = waitlist === "1" && !selectedFull;
  const showWaitlist =
    !showClosed &&
    (scheduleStatus === "pending" ||
      courseLevelWaitlist ||
      selectedFull ||
      scheduleStatus === "full");
  const waitlistSession =
    scheduleStatus === "pending" || courseLevelWaitlist
      ? undefined
      : selectedFull
        ? selectedDate
        : nearestFullDate(dates, occupancy, courseAvailability);
  const complimentary = isComplimentaryCourse(course);
  const signedInUser = await getCurrentUser();
  const waitlistHeading =
    scheduleStatus === "pending" ? courseT("notifyMeCta") : courseT("waitlistCta");
  const waitlistIntro =
    scheduleStatus === "pending"
      ? waitlistT("intro", {location: course.location[locale]})
      : waitlistSession
        ? waitlistT("introFullSession", {
            location: course.location[locale],
            date: formatCourseDateRange(waitlistSession, locale),
          })
        : waitlistT("introUnsuitableDates", {location: course.location[locale]});

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
              name: complimentary ? t("titleFree") : t("title"),
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
            {showClosed
              ? courseT("closedCta")
              : showWaitlist
                ? waitlistHeading
                : complimentary
                  ? t("titleFree")
                  : t("title")}
          </h1>
          <p className="mt-5 text-lead text-ink-muted">
            {showClosed
              ? courseT("closedIntro")
              : showWaitlist
                ? waitlistIntro
                : complimentary
                  ? t("introFree")
                  : t("intro")}
          </p>
        </div>

        <aside className="mt-8 max-w-xl border border-line bg-white p-5 sm:p-6">
          <CourseAdviceOffer
            courseSlug={course.slug[locale]}
            eyebrow={adviceT("eyebrow")}
            title={adviceT("offerTitle")}
            body={adviceT("offerBody")}
            callLabel={adviceT("offerCall")}
            writePrompt={adviceT("offerWritePrompt")}
            writeLabel={adviceT("offerWrite")}
          />
        </aside>

        <div className="mt-10 sm:mt-12">
          {showClosed ? null : showWaitlist ? (
            <WaitlistForm
              locale={locale}
              course={course}
              {...(waitlistSession ? {courseSessionId: waitlistSession.id} : {})}
              {...(scheduleStatus === "pending"
                ? {submitLabel: courseT("notifyMeCta")}
                : {})}
              {...(signedInUser ? {defaults: checkoutDefaultsFromUser(signedInUser)} : {})}
            />
          ) : (
            <BookingForm
              locale={locale}
              course={course}
              dates={openDates}
              {...(date && openDates.some((item) => item.id === date)
                ? {initialDateId: date}
                : {})}
              {...(signedInUser
                ? {defaults: checkoutDefaultsFromUser(signedInUser)}
                : {})}
            />
          )}
        </div>
      </Section>
    </SiteShell>
  );
}

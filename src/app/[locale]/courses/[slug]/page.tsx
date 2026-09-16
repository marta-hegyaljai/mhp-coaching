import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {countOccupyingEnrolmentsByDate} from "@/features/bookings/repository";
import {CourseBookingBar} from "@/features/courses/components/course-booking-bar";
import {CourseArtwork} from "@/features/courses/components/course-artwork";
import {CourseDates} from "@/features/courses/components/course-dates";
import {CourseUpcomingSessions} from "@/features/courses/components/course-upcoming-sessions";
import {CourseWaitlistLink} from "@/features/courses/components/course-waitlist-link";
import {CourseAdviceOffer} from "@/features/course-calls/components/advice-offer";
import {ProgrammeModules} from "@/features/courses/components/programme/programme-modules";
import {ProgrammeNotice} from "@/features/courses/components/programme/programme-notice";
import {courseLocaleHrefs} from "@/features/courses/locale-hrefs";
import {loadPublishedCourseBySlug, loadPublishedCourses} from "@/features/courses/live";
import {
  courseScheduleStatus,
  nearestFullDate,
  publicCourseAction,
} from "@/features/courses/occupancy";
import {findProgrammesForModule, resolveProgramme} from "@/features/courses/programme";
import {formatCataloguePrice} from "@/features/courses/price";
import {
  getBookableDates,
  getCourseStaticParams,
} from "@/features/courses/queries";
import {getCourseSourceContent} from "@/features/courses/source-content";
import {isProgrammeCourse, isSupervisionCourse, courseAvailabilityOf} from "@/features/courses/types";
import {UPCOMING_SESSION_PREVIEW_COUNT} from "@/features/courses/upcoming-sessions";
import {formatChf} from "@/features/payments/money";
import {BreadcrumbTrail} from "@/features/seo/breadcrumb-trail";
import {courseJsonLd, eventJsonLd} from "@/features/seo/json-ld";
import {JsonLd} from "@/features/seo/json-ld-script";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link, redirect} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon, PinIcon} from "@/shared/ui/icons";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Price} from "@/shared/ui/price";

type CoursePageProps = {
  params: Promise<{locale: AppLocale; slug: string}>;
};

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getCourseStaticParams();
}

export async function generateMetadata({params}: CoursePageProps) {
  const {locale, slug} = await params;
  const course = await loadPublishedCourseBySlug(slug);

  if (!course) {
    return {};
  }

  return buildPageMetadata({
    locale,
    title: course.title[locale],
    description: course.shortDescription[locale],
    hrefForLocale: (targetLocale) => ({
      pathname: "/courses/[slug]",
      params: {slug: course.slug[targetLocale]},
    }),
  });
}

export default async function CourseDetailPage({params}: CoursePageProps) {
  const {locale, slug} = await params;
  setRequestLocale(locale);
  const course = await loadPublishedCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  if (course.slug[locale] !== slug) {
    redirect({
      href: {
        pathname: "/courses/[slug]",
        params: {slug: course.slug[locale]},
      },
      locale,
    });
  }

  const t = await getTranslations("CourseDetail");
  const adviceT = await getTranslations("CourseAdvice");
  const coursesT = await getTranslations("CoursesPage");
  const navT = await getTranslations("Nav");
  const dates = getBookableDates(course);
  const occupancy = (await countOccupyingEnrolmentsByDate(dates.map((date) => date.id))) ?? {};
  const courseAvailability = courseAvailabilityOf(course);
  const scheduleStatus = courseScheduleStatus(dates, occupancy, courseAvailability);
  const hasDates = dates.length > 0;
  const extraSessionCount = Math.max(
    dates.length - UPCOMING_SESSION_PREVIEW_COUNT,
    0,
  );
  const fullSession = nearestFullDate(dates, occupancy, courseAvailability);
  const action = publicCourseAction(scheduleStatus);
  const closed = action === "closed";
  const bookQuery =
    action === "waitlist" && fullSession
      ? {date: fullSession.id, waitlist: "1"}
      : action === "waitlist" || action === "notify"
        ? {waitlist: "1"}
        : undefined;
  const bookHref = {
    pathname: "/courses/[slug]/book",
    params: {slug: course.slug[locale]},
    ...(bookQuery ? {query: bookQuery} : {}),
  } as const;
  const price = formatCataloguePrice(course.priceChf, locale);
  const sourceContent = getCourseSourceContent(course);
  const catalogue = await loadPublishedCourses();
  const isProgramme = isProgrammeCourse(course);
  const isSupervision = isSupervisionCourse(course);
  const bookCta = isSupervision ? t("supervisionBookCta") : t("bookCta");
  const bookShort = isSupervision ? t("supervisionBookShort") : t("bookShort");
  const primaryCta =
    action === "closed"
      ? t("closedCta")
      : action === "notify"
        ? t("notifyMeCta")
        : action === "waitlist"
          ? t("waitlistCta")
          : bookCta;
  const primaryShort =
    action === "closed"
      ? t("closedShort")
      : action === "notify"
        ? t("notifyMeShort")
        : action === "waitlist"
          ? t("waitlistShort")
          : bookShort;
  const programmeView = isProgramme ? resolveProgramme(course, catalogue) : null;
  const parentProgrammes = isProgramme
    ? []
    : findProgrammesForModule(course.id, catalogue);
  const showProgrammeSaving = (programmeView?.savingsChf ?? 0) > 0;

  return (
    <SiteShell
      locale={locale}
      hreflangs={courseLocaleHrefs("/courses/[slug]", course)}
      footerCta={
        closed
          ? null
          : {
              href: bookHref,
              label: primaryCta,
            }
      }
      bottomBar={
        closed ? undefined : (
          <CourseBookingBar
            course={course}
            locale={locale}
            label={primaryShort}
            fromLabel={t("price")}
            {...(bookQuery ? {query: bookQuery} : {})}
          />
        )
      }
    >
      <JsonLd data={courseJsonLd(course, locale)} />
      {eventJsonLd(course, locale).map((event) => (
        <JsonLd key={String(event.startDate)} data={event} />
      ))}

      <Section size="sm" className="pt-8">
        <BreadcrumbTrail
          label={navT("breadcrumb")}
          items={[
            {name: coursesT("breadcrumbHome"), path: localizedPath(locale, "/")},
            {name: t("breadcrumbCourses"), path: localizedPath(locale, "/courses")},
            {
              name: course.title[locale],
              path: localizedPath(locale, {
                pathname: "/courses/[slug]",
                params: {slug: course.slug[locale]},
              }),
            },
          ]}
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-8">
              <div className="relative aspect-square overflow-hidden border border-ink bg-white">
                <CourseArtwork
                  course={course}
                  priority
                  sizes="(min-width: 640px) 192px, 112px"
                />
              </div>
              <div>
                <Eyebrow>
                  {isProgramme
                    ? `${coursesT("programmeEyebrow")} · ${course.duration[locale]}`
                    : isSupervision
                      ? `${coursesT("supervisionEyebrow")} · ${course.duration[locale]}`
                      : course.duration[locale]}
                </Eyebrow>
                <h1 className="mt-4 font-serif text-title">{course.title[locale]}</h1>
              </div>
            </div>
            <p className="mt-6 text-lead text-ink-muted">
              {course.shortDescription[locale]}
            </p>
          </div>

          <aside className="lg:col-span-5">
            <div className="rounded-panel border border-line bg-parchment p-6 sm:p-7">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
                {t("price")}
              </p>
              <Price size="lg" className="mt-2">
                {price}
              </Price>
              <p className="mt-1 text-sm text-ink-subtle">
                {course.duration[locale]}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-subtle">
                <PinIcon className="h-3.5 w-3.5" />
                {course.location[locale]}
              </p>

              {hasDates ? (
                <CourseUpcomingSessions
                  dates={dates}
                  locale={locale}
                  courseSlug={course.slug[locale]}
                  occupancy={occupancy}
                  courseAvailability={courseAvailability}
                  heading={
                    dates.length > 1 ? t("upcomingSessions") : t("nextSession")
                  }
                  showMoreLabel={t("showMoreSessions", {count: extraSessionCount})}
                  showLessLabel={t("showLessSessions")}
                />
              ) : (
                <p className="mt-6 text-sm leading-7 text-ink-muted">
                  {t("datesComing")}
                </p>
              )}
              {closed ? (
                <p className="mt-6 border border-ink bg-white px-4 py-3 text-sm font-medium text-ink">
                  {t("closedCta")}
                </p>
              ) : (
                <Link
                  href={bookHref}
                  className={`${buttonStyles({size: "lg", block: true})} mt-6`}
                >
                  {primaryCta}
                  <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
                </Link>
              )}
              {scheduleStatus === "open" ? (
                <CourseWaitlistLink
                  courseSlug={course.slug[locale]}
                  prompt={t("waitlistAltPrompt")}
                  label={t("waitlistCta")}
                  className="mt-3"
                />
              ) : null}
              <CourseAdviceOffer
                courseSlug={course.slug[locale]}
                eyebrow={adviceT("eyebrow")}
                title={adviceT("offerTitle")}
                body={adviceT("offerBody")}
                callLabel={adviceT("offerCall")}
                writePrompt={adviceT("offerWritePrompt")}
                writeLabel={adviceT("offerWrite")}
                className="mt-6 border-t border-line pt-5"
              />
            </div>
            <ProgrammeNotice
              programmes={parentProgrammes}
              locale={locale}
              eyebrow={coursesT("programmeEyebrow")}
              promptFor={(title) => coursesT("programmePartOf", {title})}
              linkLabel={coursesT("programmeViewCta")}
              className="mt-6"
            />
          </aside>
        </div>
      </Section>

      {programmeView ? (
        <Section size="sm" tone="shell" ariaLabelledBy="course-programme-modules">
          <ProgrammeModules
            view={programmeView}
            locale={locale}
            headingId="course-programme-modules"
            labels={{
              title: coursesT("programmeIncludesTitle"),
              intro: coursesT("programmeModulesIntro"),
              comparison: showProgrammeSaving
                ? coursesT("programmeComparison", {
                    price: formatChf(programmeView.modulesPriceChf, locale, {
                      compact: true,
                    }),
                  })
                : null,
              savings: showProgrammeSaving
                ? coursesT("programmeSavings", {
                    amount: formatChf(programmeView.savingsChf, locale, {compact: true}),
                  })
                : null,
            }}
          />
        </Section>
      ) : null}

      <Section size="sm" ariaLabelledBy="course-about">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2 id="course-about" className="font-serif text-heading">
              {isSupervision ? t("supervisionAbout") : t("about")}
            </h2>
            <p className="mt-6 text-base leading-8 text-ink-muted">
              {sourceContent.intro ?? course.description[locale]}
            </p>
            {locale !== "fr" ? (
              <p className="mt-4 border-l-2 border-gold pl-4 text-sm leading-6 text-ink-subtle">
                {t("sourceLanguageNotice")}
              </p>
            ) : null}
          </div>
          <dl className="grid gap-6 lg:col-span-5">
            <div className="border-t border-line pt-4">
              <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-bronze">
                {t("audience")}
              </dt>
              <dd className="mt-2 text-sm leading-7 text-ink-muted">
                {course.audience[locale]}
              </dd>
            </div>
            <div className="border-t border-line pt-4">
              <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-bronze">
                {t("duration")}
              </dt>
              <dd className="mt-2 text-sm text-ink-muted">
                {course.duration[locale]}
              </dd>
            </div>
            <div className="border-t border-line pt-4">
              <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-bronze">
                {t("location")}
              </dt>
              <dd className="mt-2 text-sm text-ink-muted">
                {course.location[locale]}
              </dd>
            </div>
            <div className="border-t border-line pt-4">
              <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-bronze">
                {t("price")}
              </dt>
              <dd className="mt-2 text-sm text-ink-muted">{price}</dd>
            </div>
          </dl>
        </div>
      </Section>

      <Section size="sm" tone="shell" ariaLabelledBy="course-content">
        <div className="max-w-4xl">
          <Eyebrow>{isSupervision ? t("supervisionSourceEyebrow") : t("sourceEyebrow")}</Eyebrow>
          <h2 id="course-content" className="mt-3 font-serif text-heading">
            {isSupervision ? t("supervisionDetailsTitle") : t("detailsTitle")}
          </h2>
          <div className="mt-8 overflow-hidden border border-ink bg-white">
            {sourceContent.sections.map((section, index) => (
              <details
                key={`${section.title}-${index}`}
                className="group border-b border-line bg-white last:border-b-0"
              >
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 px-5 py-4 text-left font-semibold marker:hidden focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink sm:px-6 [&::-webkit-details-marker]:hidden">
                  <span>{section.title}</span>
                  <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center text-xl font-light leading-none group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-6 pr-12 sm:px-6 sm:pr-16">
                  {section.items.length === 1 ? (
                    <p className="text-base leading-8 text-ink-muted">{section.items[0]}</p>
                  ) : (
                    <ul className="space-y-3 text-base leading-7 text-ink-muted">
                      {section.items.map((item, itemIndex) => (
                        <li key={`${item}-${itemIndex}`} className="flex gap-3">
                          <span aria-hidden="true" className="mt-[0.72rem] h-1 w-1 shrink-0 bg-gold" />
                          <span>{item.replace(/^·\s*/, "")}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            ))}
          </div>
          <p className="mt-6 text-xs leading-5 text-ink-subtle">
            {t("sourceCredit")}
          </p>
        </div>
      </Section>

      <Section size="sm" tone="shell" id="dates" ariaLabelledBy="course-dates">
        <h2 id="course-dates" className="font-serif text-heading">
          {scheduleStatus === "pending" ? t("datesComing") : t("upcoming")}
        </h2>
        {dates.length === 0 ? (
          <p className="mt-4 max-w-xl text-base leading-7 text-ink-muted">
            {t("notifyMeCta")}
          </p>
        ) : (
          <CourseDates
            course={course}
            dates={dates}
            locale={locale}
            occupancy={occupancy}
            bookLabel={t("bookDate")}
            waitlistLabel={t("waitlistCta")}
            closedLabel={t("closedCta")}
            seatsLabel={(capacity) => coursesT("seats", {count: capacity})}
            seatsLeftLabel={(count) => t("seatsLeft", {count})}
          />
        )}
        {scheduleStatus === "open" ? (
          <CourseWaitlistLink
            courseSlug={course.slug[locale]}
            prompt={t("waitlistAltPrompt")}
            label={t("waitlistCta")}
            className="mt-6 max-w-xl"
          />
        ) : null}
      </Section>
    </SiteShell>
  );
}

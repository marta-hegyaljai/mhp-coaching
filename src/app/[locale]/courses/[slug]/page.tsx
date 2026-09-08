import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {CourseBookingBar} from "@/features/courses/components/course-booking-bar";
import {CourseDates} from "@/features/courses/components/course-dates";
import {formatCourseDateRange} from "@/features/courses/dates";
import {courseLocaleHrefs} from "@/features/courses/locale-hrefs";
import {
  getBookableDates,
  getCourseBySlug,
  getCourseStaticParams,
} from "@/features/courses/queries";
import {PaymentMethods} from "@/features/payments/components/payment-methods";
import {formatChf} from "@/features/payments/money";
import {BreadcrumbTrail} from "@/features/seo/breadcrumb-trail";
import {courseJsonLd, eventJsonLd} from "@/features/seo/json-ld";
import {JsonLd} from "@/features/seo/json-ld-script";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link, redirect} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon, CalendarIcon, PinIcon} from "@/shared/ui/icons";
import {Eyebrow, Section} from "@/shared/ui/layout";

type CoursePageProps = {
  params: Promise<{locale: AppLocale; slug: string}>;
};

export function generateStaticParams() {
  return getCourseStaticParams();
}

export async function generateMetadata({params}: CoursePageProps) {
  const {locale, slug} = await params;
  const course = getCourseBySlug(slug);

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
  const course = getCourseBySlug(slug);

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
  const coursesT = await getTranslations("CoursesPage");
  const navT = await getTranslations("Nav");
  const paymentsT = await getTranslations("Payments");
  const dates = getBookableDates(course);
  const nextDate = dates[0];
  const price = formatChf(course.priceChf, locale, {compact: true});

  return (
    <SiteShell
      locale={locale}
      hreflangs={courseLocaleHrefs("/courses/[slug]", course)}
      footerCta={
        dates.length > 0
          ? {
              href: {
                pathname: "/courses/[slug]/book",
                params: {slug: course.slug[locale]},
              },
              label: t("bookCta"),
            }
          : {href: "/contact", label: t("contactCta")}
      }
      bottomBar={
        dates.length > 0 ? (
          <CourseBookingBar
            course={course}
            locale={locale}
            label={t("bookShort")}
            fromLabel={t("price")}
          />
        ) : undefined
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
            <Eyebrow>{course.duration[locale]}</Eyebrow>
            <h1 className="mt-4 font-serif text-title">{course.title[locale]}</h1>
            <p className="mt-6 text-lead text-ink-muted">
              {course.shortDescription[locale]}
            </p>
          </div>

          <aside className="lg:col-span-5">
            <div className="rounded-panel border border-line bg-parchment p-6 sm:p-7">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
                {t("price")}
              </p>
              <p className="mt-2 font-serif text-heading">{price}</p>
              <p className="mt-1 text-sm text-ink-subtle">
                {course.duration[locale]}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-subtle">
                <PinIcon className="h-3.5 w-3.5" />
                {course.location[locale]}
              </p>

              {nextDate ? (
                <div className="mt-5 border-t border-line-soft pt-5">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">
                    <CalendarIcon className="h-3.5 w-3.5 text-bronze" />
                    {t("nextSession")}
                  </p>
                  <p className="mt-1.5 text-sm font-medium">
                    {nextDate.location[locale]} ·{" "}
                    {formatCourseDateRange(nextDate, locale)}
                  </p>
                </div>
              ) : null}

              {dates.length > 0 ? (
                <>
                  <Link
                    href={{
                      pathname: "/courses/[slug]/book",
                      params: {slug: course.slug[locale]},
                    }}
                    className={`${buttonStyles({size: "lg", block: true})} mt-6`}
                  >
                    {t("bookCta")}
                    <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
                  </Link>
                  <PaymentMethods
                    note={paymentsT("secureNote")}
                    className="mt-5"
                  />
                </>
              ) : (
                <>
                  <p className="mt-6 text-sm leading-7 text-ink-muted">
                    {t("noDates")}
                  </p>
                  <Link
                    href="/contact"
                    className={`${buttonStyles({variant: "secondary", size: "lg", block: true})} mt-5`}
                  >
                    {t("contactCta")}
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>
      </Section>

      <Section size="sm" ariaLabelledBy="course-about">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2 id="course-about" className="font-serif text-heading">
              {t("about")}
            </h2>
            <p className="mt-6 text-base leading-8 text-ink-muted">
              {course.description[locale]}
            </p>
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

      <Section size="sm" tone="shell" id="dates" ariaLabelledBy="course-dates">
        <h2 id="course-dates" className="font-serif text-heading">
          {t("upcoming")}
        </h2>
        {dates.length === 0 ? (
          <p className="mt-4 max-w-xl text-base leading-7 text-ink-muted">
            {t("noDates")}
          </p>
        ) : (
          <CourseDates
            course={course}
            dates={dates}
            locale={locale}
            bookLabel={t("bookDate")}
            seatsLabel={(capacity) => coursesT("seats", {count: capacity})}
          />
        )}
      </Section>
    </SiteShell>
  );
}

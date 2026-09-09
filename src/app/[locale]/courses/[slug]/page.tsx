import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {CourseBookingBar} from "@/features/courses/components/course-booking-bar";
import {CourseArtwork} from "@/features/courses/components/course-artwork";
import {CourseDates} from "@/features/courses/components/course-dates";
import {formatCourseDateRange} from "@/features/courses/dates";
import {courseLocaleHrefs} from "@/features/courses/locale-hrefs";
import {
  getBookableDates,
  getCourseBySlug,
  getCourseStaticParams,
} from "@/features/courses/queries";
import {getCourseSourceContent} from "@/features/courses/source-content";
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
import {Price} from "@/shared/ui/price";

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
  const dates = getBookableDates(course);
  const nextDate = dates[0];
  const hasDates = dates.length > 0;
  const bookHref = {
    pathname: "/courses/[slug]/book",
    params: {slug: course.slug[locale]},
  } as const;
  const price = formatChf(course.priceChf, locale, {compact: true});
  const sourceContent = getCourseSourceContent(course);

  return (
    <SiteShell
      locale={locale}
      hreflangs={courseLocaleHrefs("/courses/[slug]", course)}
      footerCta={{
        href: bookHref,
        label: hasDates ? t("bookCta") : t("waitlistCta"),
      }}
      bottomBar={
        <CourseBookingBar
          course={course}
          locale={locale}
          label={hasDates ? t("bookShort") : t("waitlistShort")}
          fromLabel={t("price")}
        />
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
                <Eyebrow>{course.duration[locale]}</Eyebrow>
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

              {!nextDate ? (
                <p className="mt-6 text-sm leading-7 text-ink-muted">
                  {t("dateToBeConfirmed")}
                </p>
              ) : null}
              <Link
                href={bookHref}
                className={`${buttonStyles({size: "lg", block: true})} mt-6`}
              >
                {hasDates ? t("bookCta") : t("waitlistCta")}
                <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
              </Link>
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
          <Eyebrow>{t("sourceEyebrow")}</Eyebrow>
          <h2 id="course-content" className="mt-3 font-serif text-heading">
            {t("detailsTitle")}
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
          {t("upcoming")}
        </h2>
        {dates.length === 0 ? (
          <p className="mt-4 max-w-xl text-base leading-7 text-ink-muted">
            {t("dateToBeConfirmed")}
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

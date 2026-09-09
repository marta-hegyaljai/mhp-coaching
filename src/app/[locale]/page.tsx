import Image from "next/image";
import {getTranslations, setRequestLocale} from "next-intl/server";

import {CourseCard} from "@/features/courses/components/course-card";
import {getPublishedCourses} from "@/features/courses/queries";
import {homeStatueJsonLd, courseListJsonLd} from "@/features/seo/json-ld";
import {JsonLd} from "@/features/seo/json-ld-script";
import {homeStatue, homeStatueAlt} from "@/features/seo/home-statue";
import {buildPageMetadata} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {catalogueCalendarHref} from "@/i18n/href";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon, PinIcon} from "@/shared/ui/icons";
import {Eyebrow, Section} from "@/shared/ui/layout";

type HomePageProps = {
  params: Promise<{locale: AppLocale}>;
};

export async function generateMetadata({params}: HomePageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Metadata"});

  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("description"),
    hrefForLocale: () => "/",
    image: {
      url: homeStatue.src,
      width: homeStatue.width,
      height: homeStatue.height,
      alt: homeStatueAlt[locale],
    },
  });
}

export default async function HomePage({params}: HomePageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("HomePage");
  const coursesT = await getTranslations("CoursesPage");
  const publishedCourses = getPublishedCourses();
  const courses = publishedCourses.slice(0, 3);
  const hiddenCourseCount = publishedCourses.length - courses.length;

  const reasons = [
    {title: t("whyRapidTitle"), body: t("whyRapidBody")},
    {title: t("whyPracticeTitle"), body: t("whyPracticeBody")},
    {title: t("whyNetworkTitle"), body: t("whyNetworkBody")},
  ];

  return (
    <SiteShell locale={locale}>
      <JsonLd data={courseListJsonLd(courses, locale)} />
      <JsonLd data={homeStatueJsonLd(locale)} />

      {/* Banner: the statue fills the block, the copy rides on one solid panel. */}
      <Section size="sm" className="pt-6 sm:pt-8">
        <div className="relative isolate flex min-h-[26rem] items-end overflow-hidden rounded-panel border border-ink bg-ink px-3 pb-3 pt-24 sm:min-h-[30rem] sm:px-5 sm:pb-5 sm:pt-32 lg:min-h-[34rem] lg:items-center lg:p-8">
          <Image
            src={homeStatue.src}
            alt={homeStatueAlt[locale]}
            fill
            priority
            sizes="(min-width: 1200px) 1152px, 100vw"
            className="-z-10 object-cover object-[center_38%]"
          />
          <div className="w-full max-w-xl rounded-panel border border-parchment/25 bg-ink/85 p-5 backdrop-blur-sm sm:p-7">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-gold">
              {t("eyebrow")}
            </p>
            <h1 className="mt-4 font-serif text-title text-parchment">{t("title")}</h1>
            <p className="mt-4 text-base leading-7 text-parchment/80">{t("intro")}</p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link
                href="/courses"
                className={`${buttonStyles({variant: "invert", size: "lg"})} w-full sm:w-auto`}
              >
                {t("ctaCourses")}
                <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
              </Link>
              <Link
                href={catalogueCalendarHref}
                className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-parchment underline-offset-4 hover:underline sm:text-base"
              >
                {t("ctaBook")}
              </Link>
            </div>

            <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-parchment/20 pt-4 text-xs text-parchment/70 sm:text-sm">
              <li className="flex items-center gap-1.5">
                <PinIcon className="h-3.5 w-3.5" />
                {t("trustLocations")}
              </li>
              <li>{t("trustGroup")}</li>
              <li>{t("trustRecognition")}</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section tone="shell" ariaLabelledBy="about-title">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Eyebrow>{t("aboutEyebrow")}</Eyebrow>
            <h2 id="about-title" className="mt-4 font-serif text-heading">
              {t("aboutTitle")}
            </h2>
          </div>
          <p className="text-base leading-8 text-ink-muted lg:col-span-7 lg:text-lg">
            {t("aboutBody")}
          </p>
        </div>
      </Section>

      <Section ariaLabelledBy="courses-title">
        <div className="max-w-2xl">
          <Eyebrow>{coursesT("eyebrow")}</Eyebrow>
          <h2 id="courses-title" className="mt-4 font-serif text-heading">
            {t("coursesTitle")}
          </h2>
          <p className="mt-4 text-base leading-7 text-ink-muted">
            {t("coursesIntro")}
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              locale={locale}
              detailsLabel={coursesT("readMore")}
              awaitingDateLabel={coursesT("waitlistLabel")}
              headingLevel="h3"
            />
          ))}
        </div>

        {/* The grid is a preview: name the rest of the catalogue explicitly. */}
        <div className="mt-4 flex flex-col gap-5 rounded-panel border border-ink bg-shell p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-6">
          {hiddenCourseCount > 0 ? (
            <p className="text-base leading-7 text-ink-muted">
              {t("coursesMore", {
                shown: courses.length,
                count: publishedCourses.length,
              })}
            </p>
          ) : null}
          <Link
            href="/courses"
            className={`${buttonStyles({size: "lg"})} w-full shrink-0 sm:w-auto`}
          >
            {t("coursesLink", {count: publishedCourses.length})}
            <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
          </Link>
        </div>
      </Section>

      <Section tone="shell" ariaLabelledBy="why-title">
        <Eyebrow>{t("whyEyebrow")}</Eyebrow>
        <h2 id="why-title" className="mt-4 max-w-2xl font-serif text-heading">
          {t("whyTitle")}
        </h2>
        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {reasons.map((reason, index) => (
            <div key={reason.title} className="border-t border-line pt-6">
              <p className="font-serif text-lg text-bronze">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-serif text-subheading">{reason.title}</h3>
              <p className="mt-3 text-sm leading-7 text-ink-muted">{reason.body}</p>
            </div>
          ))}
        </div>
      </Section>
    </SiteShell>
  );
}

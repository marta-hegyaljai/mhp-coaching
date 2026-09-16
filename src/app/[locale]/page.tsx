import {getTranslations, setRequestLocale} from "next-intl/server";

import {CourseCard} from "@/features/courses/components/course-card";
import {loadPublishedCourses} from "@/features/courses/live";
import {AdviceInvite} from "@/features/course-calls/components/advice-invite";
import {splitCatalogueByFormat} from "@/features/courses/programme";
import {HomeHero} from "@/features/home/home-hero";
import {MethodReasons} from "@/features/home/method-reasons";
import {homeStatueJsonLd, courseListJsonLd} from "@/features/seo/json-ld";
import {JsonLd} from "@/features/seo/json-ld-script";
import {homeStatue, homeStatueAlt} from "@/features/seo/home-statue";
import {buildPageMetadata} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Eyebrow, Section} from "@/shared/ui/layout";

type HomePageProps = {
  params: Promise<{locale: AppLocale}>;
};

export const dynamic = "force-dynamic";

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
  const publishedCourses = await loadPublishedCourses();
  // The home teaser shows individual modules; bundles live on the catalogue.
  const modules = splitCatalogueByFormat(publishedCourses).modules;
  const courses = modules.slice(0, 3);
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

      <HomeHero locale={locale} />

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

      <Section size="sm">
        <AdviceInvite
          headingId="advice-invite-title"
          eyebrow={t("adviceEyebrow")}
          title={t("adviceTitle")}
          body={t("adviceBody")}
          writePrompt={t("adviceWritePrompt")}
          writeLabel={t("adviceWrite")}
          callLabel={t("adviceCta")}
        />
      </Section>

      <MethodReasons
        eyebrow={t("whyEyebrow")}
        title={t("whyTitle")}
        reasons={reasons}
      />
    </SiteShell>
  );
}

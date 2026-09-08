import {getTranslations, setRequestLocale} from "next-intl/server";

import {CourseCard} from "@/features/courses/components/course-card";
import {getCourseById, getPublishedCourses} from "@/features/courses/queries";
import {PaymentMethods} from "@/features/payments/components/payment-methods";
import {courseListJsonLd} from "@/features/seo/json-ld";
import {JsonLd} from "@/features/seo/json-ld-script";
import {buildPageMetadata} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
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
  });
}

export default async function HomePage({params}: HomePageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("HomePage");
  const coursesT = await getTranslations("CoursesPage");
  const paymentsT = await getTranslations("Payments");
  const courses = getPublishedCourses().slice(0, 3);
  const practitioner = getCourseById("omni-practitioner");

  const reasons = [
    {title: t("whyRapidTitle"), body: t("whyRapidBody")},
    {title: t("whyPracticeTitle"), body: t("whyPracticeBody")},
    {title: t("whyNetworkTitle"), body: t("whyNetworkBody")},
  ];

  return (
    <SiteShell locale={locale}>
      <JsonLd data={courseListJsonLd(courses, locale)} />

      <Section size="lg" className="pt-10 sm:pt-14">
        <div className="rise">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h1 className="mt-6 max-w-4xl font-serif text-display">{t("title")}</h1>
          <p className="mt-7 max-w-2xl text-lead text-ink-muted">{t("intro")}</p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/courses"
              className={`${buttonStyles({size: "lg"})} w-full sm:w-auto`}
            >
              {t("ctaCourses")}
              <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
            </Link>
            {practitioner ? (
              <Link
                href={{
                  pathname: "/courses/[slug]/book",
                  params: {slug: practitioner.slug[locale]},
                }}
                className={`${buttonStyles({variant: "secondary", size: "lg"})} w-full sm:w-auto`}
              >
                {t("ctaBook")}
              </Link>
            ) : null}
          </div>

          <PaymentMethods note={paymentsT("secureNote")} className="mt-6" />

          <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-6 text-sm text-ink-subtle">
            <li className="flex items-center gap-2">
              <PinIcon className="h-3.5 w-3.5 text-bronze" />
              {t("trustLocations")}
            </li>
            <li>{t("trustGroup")}</li>
            <li>{t("trustRecognition")}</li>
          </ul>
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
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Eyebrow>{coursesT("eyebrow")}</Eyebrow>
            <h2 id="courses-title" className="mt-4 font-serif text-heading">
              {t("coursesTitle")}
            </h2>
            <p className="mt-4 text-base leading-7 text-ink-muted">
              {t("coursesIntro")}
            </p>
          </div>
          <Link
            href="/courses"
            className={`${buttonStyles({variant: "quiet"})} self-start px-0`}
          >
            {t("coursesLink")}
            <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-10">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              locale={locale}
              detailsLabel={coursesT("readMore")}
              headingLevel="h3"
            />
          ))}
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

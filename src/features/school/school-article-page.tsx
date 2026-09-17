import {getTranslations, setRequestLocale} from "next-intl/server";

import {getCourseById} from "@/features/courses/queries";
import {BreadcrumbTrail} from "@/features/seo/breadcrumb-trail";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {CurriculumTable} from "@/features/school/curriculum-table";
import {
  schoolPageCopy,
  siblingSchoolPages,
  type SchoolPageId,
} from "@/features/school/pages";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Panel} from "@/shared/ui/panel";

type SchoolArticlePageProps = {
  params: Promise<{locale: AppLocale}>;
};

export function schoolArticleMetadata(id: SchoolPageId) {
  return async function generateMetadata({params}: SchoolArticlePageProps) {
    const {locale} = await params;
    const {page} = schoolPageCopy(id);

    return buildPageMetadata({
      locale,
      title: page.metaTitle[locale],
      description: page.metaDescription[locale],
      hrefForLocale: () => page.pathname,
    });
  };
}

export function schoolArticlePage(id: SchoolPageId) {
  return async function SchoolArticlePage({params}: SchoolArticlePageProps) {
    const {locale} = await params;
    setRequestLocale(locale);
    const {page, block} = schoolPageCopy(id);
    const t = await getTranslations({locale, namespace: "SchoolPage"});
    const navT = await getTranslations({locale, namespace: "Nav"});
    const coursesT = await getTranslations({locale, namespace: "CoursesPage"});
    const pagePath = localizedPath(locale, page.pathname);
    const relatedCourse = page.relatedCourseId
      ? getCourseById(page.relatedCourseId)
      : undefined;
    const siblings = siblingSchoolPages(page.id);

    return (
      <SiteShell locale={locale}>
        <Section size="sm" className="pt-8 pb-16 sm:pb-24">
          <BreadcrumbTrail
            label={navT("breadcrumb")}
            items={[
              {name: coursesT("breadcrumbHome"), path: localizedPath(locale, "/")},
              {name: page.name[locale], path: pagePath},
            ]}
          />

          <article className="mt-8 max-w-3xl">
            {/* One shared eyebrow: a per-page one only repeated the H1. */}
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            {/* The card claim is the promise; the H1 names the page. */}
            <h1 id={page.blockId} className="mt-4 scroll-mt-24 font-serif text-title">
              {page.name[locale]}
            </h1>
            <p className="mt-4 font-serif text-subheading leading-snug text-ink">
              {block.title[locale]}
            </p>
            <p className="mt-6 text-lead text-ink-muted">{page.lead[locale]}</p>

            {page.body.map((paragraph) => (
              <p
                key={paragraph[locale]}
                className="mt-4 text-base leading-8 text-ink-muted"
              >
                {paragraph[locale]}
              </p>
            ))}
          </article>

          {page.showsCatalogue ? (
            <CurriculumTable
              locale={locale}
              headingId="curriculum-table-title"
              title={t("curriculumTitle")}
              hoursLabel={t("curriculumHours")}
              priceLabel={t("curriculumPrice")}
            />
          ) : null}

          {page.faculty ? (
            <ul className="mt-12 grid gap-4 md:grid-cols-2">
              {page.faculty.map((person) => (
                <li key={person.name}>
                  <Panel as="article" className="h-full">
                    <h2 className="font-serif text-subheading">{person.name}</h2>
                    <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                      {person.role[locale]}
                    </p>
                    <p className="mt-4 text-sm leading-7 text-ink-muted">
                      {person.training[locale]}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-ink-muted">
                      {person.practice[locale]}
                    </p>
                  </Panel>
                </li>
              ))}
            </ul>
          ) : null}

          {page.works ? (
            <section aria-labelledby="works-title" className="mt-12 max-w-3xl">
              <h2 id="works-title" className="font-serif text-heading">
                {t("worksTitle")}
              </h2>
              <ul className="mt-6 border-t border-ink">
                {page.works.map((work) => (
                  <li key={work.title[locale]} className="border-b border-line py-5">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
                      {work.kind[locale]}
                    </p>
                    <h3 className="mt-2 font-serif text-subheading">
                      {work.href ? (
                        <a
                          href={work.href}
                          target="_blank"
                          rel="noreferrer"
                          className="underline-offset-4 hover:underline"
                        >
                          {work.title[locale]}
                        </a>
                      ) : (
                        work.title[locale]
                      )}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-ink-muted">
                      {work.detail[locale]}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {page.registries ? (
            <section aria-labelledby="registries-title" className="mt-12 max-w-3xl">
              <h2 id="registries-title" className="font-serif text-heading">
                {t("registriesTitle")}
              </h2>
              <ul className="mt-6 border-t border-ink">
                {page.registries.map((registry) => (
                  <li key={registry.name} className="border-b border-line py-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="font-serif text-subheading">{registry.name}</h3>
                      {registry.memberId ? (
                        <p className="text-sm tabular-nums text-ink-muted">
                          {t("registryMemberId", {id: registry.memberId})}
                        </p>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-ink-muted">
                      {registry.scope[locale]}
                    </p>
                    <a
                      href={registry.href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink underline-offset-4 hover:underline"
                    >
                      {t("registryVisit", {name: registry.name})}
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
                        {t("externalLink")}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            {relatedCourse ? (
              <Link
                href={{
                  pathname: "/courses/[slug]",
                  params: {slug: relatedCourse.slug[locale]},
                }}
                className={buttonStyles()}
              >
                {t("supervisionCourseLink")}
              </Link>
            ) : page.id === "faculty" ? (
              <Link href="/about" className={buttonStyles()}>
                {t("aboutLink")}
              </Link>
            ) : (
              <Link href="/courses" className={buttonStyles()}>
                {t("coursesCta")}
              </Link>
            )}
            <Link href="/contact" className={buttonStyles({variant: "secondary"})}>
              {t("contactCta")}
            </Link>
          </div>

          {/* Without this every school page is a dead end for search traffic. */}
          <nav aria-labelledby="siblings-title" className="mt-16 border-t border-ink pt-8">
            <h2
              id="siblings-title"
              className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-ink-subtle"
            >
              {t("siblingsTitle")}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.map((sibling) => (
                <li key={sibling.id}>
                  <Link
                    href={sibling.pathname}
                    className="group/button flex min-h-11 items-center justify-between gap-3 border-b border-line py-2 text-sm font-semibold text-ink underline-offset-4 hover:underline"
                  >
                    {sibling.name[locale]}
                    <ArrowRightIcon className="shrink-0 transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Section>
      </SiteShell>
    );
  };
}

import {getTranslations, setRequestLocale} from "next-intl/server";

import {adviceHref, generalAdvice, parseAdviceQuery} from "@/features/course-calls/advice-route";
import {loadAdviceView} from "@/features/course-calls/advice-view";
import {AdvicePanel} from "@/features/course-calls/components/advice-panel";
import {BreadcrumbTrail} from "@/features/seo/breadcrumb-trail";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

type GeneralAdvicePageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{mode?: string; date?: string}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: GeneralAdvicePageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "GeneralAdvice"});

  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("description"),
    hrefForLocale: () => "/advice",
  });
}

/**
 * The shareable advice page: the same fifteen-minute slots as a course call,
 * with no course attached.
 */
export default async function GeneralAdvicePage({
  params,
  searchParams,
}: GeneralAdvicePageProps) {
  const {locale} = await params;
  const query = parseAdviceQuery(await searchParams);
  setRequestLocale(locale);

  const t = await getTranslations("GeneralAdvice");
  const coursesT = await getTranslations("CoursesPage");
  const navT = await getTranslations("Nav");
  const view = await loadAdviceView(query.date);

  return (
    <SiteShell locale={locale}>
      <Section size="sm" className="pt-8 pb-16 sm:pb-24">
        <BreadcrumbTrail
          label={navT("breadcrumb")}
          items={[
            {name: coursesT("breadcrumbHome"), path: localizedPath(locale, "/")},
            {
              name: t("title"),
              path: localizedPath(
                locale,
                adviceHref(generalAdvice, {date: view.selectedDate}),
              ),
            },
          ]}
        />

        <div className="mt-8 max-w-2xl">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h1 className="mt-4 font-serif text-title">{t("title")}</h1>
          <p className="mt-5 text-lead text-ink-muted">
            {query.mode === "write" ? t("writeIntro") : t("intro")}
          </p>
        </div>

        <AdvicePanel
          locale={locale}
          target={generalAdvice}
          query={query}
          view={view}
          courseId={null}
        />
      </Section>
    </SiteShell>
  );
}

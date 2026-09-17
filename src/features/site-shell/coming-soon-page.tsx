import {getTranslations, setRequestLocale} from "next-intl/server";

import {BreadcrumbTrail} from "@/features/seo/breadcrumb-trail";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {Link} from "@/i18n/navigation";
import type {PathnameHref} from "@/i18n/href";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {Eyebrow, Section} from "@/shared/ui/layout";

import type {NavLabelKey} from "./nav-model";
import {SiteShell} from "./site-shell";

export type ComingSoonCopy = {
  navKey: NavLabelKey;
  pathname: Extract<PathnameHref, "/case-library" | "/insights">;
  namespace: "CaseLibraryPage" | "InsightsPage";
  /** Renders the namespace's `subtitle` as the deck under the H1. */
  hasSubtitle?: boolean;
};

type ComingSoonPageProps = {
  params: Promise<{locale: AppLocale}>;
};

export function comingSoonMetadata(copy: ComingSoonCopy) {
  return async function generateMetadata({params}: ComingSoonPageProps) {
    const {locale} = await params;
    const t = await getTranslations({locale, namespace: copy.namespace});

    return buildPageMetadata({
      locale,
      title: t("title"),
      description: t("description"),
      hrefForLocale: () => copy.pathname,
    });
  };
}

export function comingSoonPage(copy: ComingSoonCopy) {
  return async function ComingSoonPage({params}: ComingSoonPageProps) {
    const {locale} = await params;
    setRequestLocale(locale);
    const t = await getTranslations({locale, namespace: copy.namespace});
    const navT = await getTranslations({locale, namespace: "Nav"});
    const homeT = await getTranslations({locale, namespace: "CoursesPage"});
    const topics = [
      {title: t("topic1Title"), body: t("topic1Body")},
      {title: t("topic2Title"), body: t("topic2Body")},
      {title: t("topic3Title"), body: t("topic3Body")},
    ];

    return (
      <SiteShell locale={locale}>
        <Section size="sm" className="pt-8 pb-16 sm:pb-24">
          <BreadcrumbTrail
            label={navT("breadcrumb")}
            items={[
              {name: homeT("breadcrumbHome"), path: localizedPath(locale, "/")},
              {name: t("title"), path: localizedPath(locale, copy.pathname)},
            ]}
          />
          <div className="mt-8 max-w-3xl">
            <Eyebrow>{t("status")}</Eyebrow>
            <h1 className="mt-4 font-serif text-title">{t("title")}</h1>
            {copy.hasSubtitle ? (
              <p className="mt-4 font-serif text-subheading leading-snug text-ink">
                {t("subtitle")}
              </p>
            ) : null}
            <p className="mt-6 text-lead text-ink-muted">{t("lead")}</p>
            <p className="mt-4 text-base leading-8 text-ink-muted">{t("intro")}</p>
            <p className="mt-4 text-base leading-8 text-ink-muted">{t("body")}</p>
          </div>

          <div className="mt-12">
            <h2 className="font-serif text-heading">{t("topicsTitle")}</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {topics.map((topic) => (
                <li
                  key={topic.title}
                  className="flex h-full flex-col rounded-panel border border-ink bg-white p-5"
                >
                  <h3 className="font-serif text-subheading">{topic.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink-muted">{topic.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/courses" className={buttonStyles()}>
              {t("coursesCta")}
            </Link>
            <Link href="/contact" className={buttonStyles({variant: "secondary"})}>
              {t("contactCta")}
            </Link>
          </div>
        </Section>
      </SiteShell>
    );
  };
}

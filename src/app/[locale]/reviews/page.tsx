import {getTranslations, setRequestLocale} from "next-intl/server";

import {BreadcrumbTrail} from "@/features/seo/breadcrumb-trail";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {TestimonialQuote} from "@/features/school/testimonial-quote";
import {testimonials} from "@/features/school/testimonials";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Panel} from "@/shared/ui/panel";

type ReviewsPageProps = {
  params: Promise<{locale: AppLocale}>;
};

export async function generateMetadata({params}: ReviewsPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "ReviewsPage"});

  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("description"),
    hrefForLocale: () => "/reviews",
  });
}

export default async function ReviewsPage({params}: ReviewsPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ReviewsPage");
  const navT = await getTranslations("Nav");
  const homeT = await getTranslations("CoursesPage");
  const pagePath = localizedPath(locale, "/reviews");

  return (
    <SiteShell locale={locale}>
      <Section size="sm" className="pt-8 pb-16 sm:pb-24">
        <BreadcrumbTrail
          label={navT("breadcrumb")}
          items={[
            {name: homeT("breadcrumbHome"), path: localizedPath(locale, "/")},
            {name: t("title"), path: pagePath},
          ]}
        />

        <div className="mt-8 grid gap-8 border-b border-ink pb-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
          <div className="max-w-3xl">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h1 className="mt-4 font-serif text-title">{t("title")}</h1>
            <p className="mt-6 text-lead text-ink-muted">{t("lead")}</p>
          </div>

          <div className="border-l-4 border-ink pl-5">
            <p className="font-serif text-[3.5rem] leading-none tracking-[-0.04em] text-ink">
              {testimonials.length}
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-ink-subtle">
              {t("countLabel")}
            </p>
          </div>
        </div>

        <ul className="mt-8 columns-1 gap-4 md:columns-2 xl:columns-3">
          {testimonials.map((entry) => (
            <li key={entry.id} className="mb-4 break-inside-avoid">
              <Panel as="article" padding="sm">
                <TestimonialQuote
                  testimonial={entry}
                  variant="archive"
                  anonymousLabel={t("anonymousLabel")}
                  participantLabel={t("participantLabel")}
                />
              </Panel>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-3 border-t border-ink pt-8 sm:flex-row">
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
}

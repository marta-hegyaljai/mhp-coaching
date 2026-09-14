import Image from "next/image";
import {getTranslations, setRequestLocale} from "next-intl/server";

import {founderAwards, founderPortrait} from "@/features/about/founder";
import {organization} from "@/features/organization/info";
import {BreadcrumbTrail} from "@/features/seo/breadcrumb-trail";
import {founderPersonJsonLd} from "@/features/seo/json-ld";
import {JsonLd} from "@/features/seo/json-ld-script";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {Eyebrow, Section} from "@/shared/ui/layout";

type AboutPageProps = {
  params: Promise<{locale: AppLocale}>;
};

export async function generateMetadata({params}: AboutPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "AboutPage"});

  return buildPageMetadata({
    locale,
    title: t("seoTitle"),
    description: t("description"),
    hrefForLocale: () => "/about",
    image: {
      url: founderPortrait.src,
      width: founderPortrait.width,
      height: founderPortrait.height,
      alt: t("imageAlt"),
    },
  });
}

export default async function AboutPage({params}: AboutPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AboutPage");
  const navT = await getTranslations("Nav");
  const homeT = await getTranslations("CoursesPage");
  const pagePath = localizedPath(locale, "/about");
  const awards = founderAwards.map((award) => t(award.key));

  return (
    <SiteShell locale={locale}>
      <JsonLd
        data={founderPersonJsonLd({
          locale,
          jobTitle: t("role"),
          description: t("description"),
          awards,
          pagePath,
        })}
      />

      <Section size="sm" className="pt-8 pb-16 sm:pb-24">
        <BreadcrumbTrail
          label={navT("breadcrumb")}
          items={[
            {name: homeT("breadcrumbHome"), path: localizedPath(locale, "/")},
            {name: t("title"), path: pagePath},
          ]}
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-12">
          <figure className="lg:col-span-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-panel border border-ink">
              <Image
                src={founderPortrait.src}
                alt={t("imageAlt")}
                fill
                priority
                sizes="(min-width: 1024px) 320px, 100vw"
                className="object-cover object-[62%_18%]"
              />
            </div>
            <figcaption className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
              {organization.founder}
            </figcaption>
          </figure>

          <div className="lg:col-span-8">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h1 className="mt-4 font-serif text-title">{t("title")}</h1>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-ink-muted">
              {t("role")}
            </p>
            <h2 className="mt-8 font-serif text-heading">{t("lead")}</h2>
            <p className="mt-5 text-base leading-8 text-ink-muted">{t("p1")}</p>
            <p className="mt-4 text-base leading-8 text-ink-muted">{t("p2")}</p>
            <p className="mt-4 text-base leading-8 text-ink-muted">{t("p3")}</p>
          </div>
        </div>

        <blockquote className="mt-12 max-w-3xl border-l-2 border-ink pl-5 sm:pl-6">
          <p className="font-serif text-subheading leading-8 text-ink">{t("quote")}</p>
          <footer className="mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
            {t("quoteAttribution")}
          </footer>
        </blockquote>

        <div className="mt-10 max-w-3xl">
          <p className="text-base leading-8 text-ink-muted">{t("p4")}</p>
          <p className="mt-4 text-base leading-8 text-ink-muted">{t("p5")}</p>
        </div>

        <section className="mt-14 max-w-3xl" aria-labelledby="recognition-title">
          <Eyebrow>{t("recognitionEyebrow")}</Eyebrow>
          <h2 id="recognition-title" className="mt-4 font-serif text-heading">
            {t("recognitionTitle")}
          </h2>
          <ol className="mt-6 border-t border-ink">
            {founderAwards.map((award) => (
              <li
                key={`${award.year}-${award.key}`}
                className="grid grid-cols-[4.5rem_1fr] gap-4 border-b border-line py-4 text-sm leading-6"
              >
                <span className="font-semibold tabular-nums text-ink">{award.year}</span>
                <span className="text-ink-muted">{t(award.key)}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-base leading-8 text-ink-muted">{t("recognitionBody")}</p>
        </section>

        <div className="mt-10">
          <Link href="/courses" className={buttonStyles()}>
            {t("coursesCta")}
          </Link>
        </div>
      </Section>
    </SiteShell>
  );
}

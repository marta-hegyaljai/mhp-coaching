import {getTranslations, setRequestLocale} from "next-intl/server";

import {organization} from "@/features/organization/info";
import {BreadcrumbTrail} from "@/features/seo/breadcrumb-trail";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

type ContactPageProps = {
  params: Promise<{locale: AppLocale}>;
};

const contactLink =
  "text-ink transition-colors duration-200 hover:text-bronze underline underline-offset-4 decoration-line";

export async function generateMetadata({params}: ContactPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "ContactPage"});

  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("description"),
    hrefForLocale: () => "/contact",
  });
}

export default async function ContactPage({params}: ContactPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ContactPage");
  const coursesT = await getTranslations("CoursesPage");
  const navT = await getTranslations("Nav");
  const hq = organization.addresses.headquarters;

  return (
    <SiteShell locale={locale}>
      <Section size="sm" className="pt-8">
        <BreadcrumbTrail
          label={navT("breadcrumb")}
          items={[
            {name: coursesT("breadcrumbHome"), path: localizedPath(locale, "/")},
            {name: t("title"), path: localizedPath(locale, "/contact")},
          ]}
        />
        <div className="mt-8 max-w-2xl">
          <Eyebrow>{navT("contact")}</Eyebrow>
          <h1 className="mt-4 font-serif text-title">{t("title")}</h1>
          <p className="mt-6 text-lead text-ink-muted">{t("intro")}</p>
          <p className="mt-4 text-base text-ink-muted">{t("languages")}</p>
        </div>

        <div className="mt-14 max-w-xl">
          <section>
            <h2 className="font-serif text-subheading">{t("hq")}</h2>
            <address className="mt-4 text-sm leading-7 text-ink-muted not-italic">
              {organization.legalName}
              <br />
              {hq.street}
              <br />
              {hq.postalCode} {hq.city}
            </address>
            <p className="mt-4 text-sm leading-8">
              <a className={contactLink} href={organization.phoneHref}>
                {organization.phone}
              </a>
              <br />
              <a
                className={contactLink}
                href={`mailto:${organization.email}`}
              >
                {organization.email}
              </a>
            </p>
          </section>
        </div>
      </Section>
    </SiteShell>
  );
}

import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {getLegalDocument} from "@/features/legal/content";
import {BreadcrumbTrail} from "@/features/seo/breadcrumb-trail";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppPathname} from "@/i18n/routing";
import type {AppLocale} from "@/i18n/routing";
import {Section} from "@/shared/ui/layout";

type LegalPageProps = {
  params: Promise<{locale: AppLocale}>;
};

const pathnames = {
  imprint: "/legal/imprint",
  privacy: "/legal/privacy",
  terms: "/legal/terms",
} as const satisfies Record<string, AppPathname>;

function legalPage(slug: "imprint" | "privacy" | "terms") {
  return {
    generateMetadata: async function generateMetadata({params}: LegalPageProps) {
      const {locale} = await params;
      const document = getLegalDocument(slug);
      const t = await getTranslations({locale, namespace: "Legal"});

      if (!document) {
        return {};
      }

      return buildPageMetadata({
        locale,
        title: t(document.titleKey),
        description: t(document.descriptionKey),
        hrefForLocale: () => pathnames[slug],
      });
    },
    Page: async function LegalDocumentPage({params}: LegalPageProps) {
      const {locale} = await params;
      setRequestLocale(locale);
      const document = getLegalDocument(slug);

      if (!document) {
        notFound();
      }

      const t = await getTranslations("Legal");
      const homeT = await getTranslations("CoursesPage");
      const navT = await getTranslations("Nav");

      return (
        <SiteShell locale={locale} footerCta={null}>
          <Section size="sm" className="pt-8 pb-16 sm:pb-24">
            <BreadcrumbTrail
              label={navT("breadcrumb")}
              items={[
                {name: homeT("breadcrumbHome"), path: localizedPath(locale, "/")},
                {
                  name: t(document.titleKey),
                  path: localizedPath(locale, pathnames[slug]),
                },
              ]}
            />
            <article className="mt-8 max-w-3xl">
              <h1 className="font-serif text-title">{t(document.titleKey)}</h1>
              {document.sections[locale].map((section) => (
                <section key={section.heading} className="mt-12">
                  <h2 className="font-serif text-subheading">{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="mt-4 text-base leading-8 text-ink-muted"
                    >
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
            </article>
          </Section>
        </SiteShell>
      );
    },
  };
}

export const imprint = legalPage("imprint");
export const privacy = legalPage("privacy");
export const terms = legalPage("terms");

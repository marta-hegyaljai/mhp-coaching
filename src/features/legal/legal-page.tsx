import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {getLegalDocument} from "@/features/legal/content";
import type {LegalSlug} from "@/features/legal/types";
import {OrganizationContactText} from "@/features/organization/contact-links";
import {BreadcrumbTrail} from "@/features/seo/breadcrumb-trail";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {Section} from "@/shared/ui/layout";

type LegalPageProps = {
  params: Promise<{locale: AppLocale}>;
};

function formatUpdatedAt(locale: AppLocale, isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat(
    locale === "en" ? "en-GB" : locale === "de" ? "de-CH" : "fr-CH",
    {day: "numeric", month: "long", year: "numeric"},
  ).format(new Date(year, month - 1, day));
}

function legalPage(slug: LegalSlug) {
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
        hrefForLocale: () => document.pathname,
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
                  path: localizedPath(locale, document.pathname),
                },
              ]}
            />
            <article className="mt-8 max-w-3xl">
              <h1 className="font-serif text-title">{t(document.titleKey)}</h1>
              <p className="mt-4 text-sm text-ink-muted">
                {t("updated", {date: formatUpdatedAt(locale, document.updatedAt)})}
              </p>
              {document.sections[locale].map((section) => (
                <section key={section.heading} className="mt-12">
                  <h2 className="font-serif text-subheading">{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <OrganizationContactText
                      key={paragraph}
                      text={paragraph}
                      className="mt-4 text-base leading-8 text-ink-muted"
                      linkClassName="text-ink underline underline-offset-4 decoration-line transition-colors duration-200 hover:text-bronze"
                    />
                  ))}
                  {section.items && section.items.length > 0 ? (
                    <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-8 text-ink-muted">
                      {section.items.map((item) => (
                        <li key={item}>
                          <OrganizationContactText
                            as="span"
                            text={item}
                            linkClassName="text-ink underline underline-offset-4 decoration-line transition-colors duration-200 hover:text-bronze"
                          />
                        </li>
                      ))}
                    </ul>
                  ) : null}
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
export const termsOfUse = legalPage("termsOfUse");
export const copyright = legalPage("copyright");

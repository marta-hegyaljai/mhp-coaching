import {getTranslations, setRequestLocale} from "next-intl/server";

import {ContactForm} from "@/features/inquiries/components/contact-form";
import {ContactLinks} from "@/features/organization/contact-links";
import {organization} from "@/features/organization/info";
import {BreadcrumbTrail} from "@/features/seo/breadcrumb-trail";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

type ContactPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{sent?: string}>;
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

export default async function ContactPage({params, searchParams}: ContactPageProps) {
  const {locale} = await params;
  const {sent} = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("ContactPage");
  const formT = await getTranslations("ContactForm");
  const coursesT = await getTranslations("CoursesPage");
  const navT = await getTranslations("Nav");
  const hq = organization.addresses.headquarters;
  const leadReceived = sent === "payment";

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

        <div className="mt-14 grid gap-12 lg:grid-cols-12">
          <section className="max-w-xl lg:col-span-5">
            <h2 className="font-serif text-subheading">{t("hq")}</h2>
            <address className="mt-4 text-sm leading-7 text-ink-muted not-italic">
              {organization.legalName}
              <br />
              {hq.street}
              <br />
              {hq.postalCode} {hq.city}
            </address>
            <ContactLinks className="mt-4 text-sm leading-8" linkClassName={contactLink} />
          </section>

          <section className="lg:col-span-7">
            <h2 className="font-serif text-subheading">{t("formTitle")}</h2>
            <p className="mt-3 mb-6 text-sm leading-7 text-ink-muted">{t("formIntro")}</p>
            {leadReceived ? (
              <p
                role="status"
                className="border border-ink bg-white px-4 py-5 text-sm leading-7 text-ink"
              >
                {formT("leadSuccess")}
              </p>
            ) : (
              <ContactForm locale={locale} kind="general" />
            )}
          </section>
        </div>
      </Section>
    </SiteShell>
  );
}

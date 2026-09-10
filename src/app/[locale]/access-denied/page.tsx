import {getTranslations, setRequestLocale} from "next-intl/server";

import {buildPageMetadata} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {Section} from "@/shared/ui/layout";

type AccessDeniedPageProps = {
  params: Promise<{locale: AppLocale}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AccessDeniedPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "AccessDenied"});

  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("body"),
    hrefForLocale: () => "/access-denied",
    robots: {index: false, follow: false},
  });
}

export default async function AccessDeniedPage({params}: AccessDeniedPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AccessDenied");

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <h1 className="font-serif text-heading">{t("title")}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-muted">{t("body")}</p>
        <Link href="/" className={`${buttonStyles()} mt-8`}>
          {t("home")}
        </Link>
      </Section>
    </SiteShell>
  );
}

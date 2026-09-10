import {getTranslations, setRequestLocale} from "next-intl/server";

import {SignUpForm} from "@/features/auth/components/sign-up-form";
import {getViewer} from "@/features/auth/require";
import {signedInHomePath} from "@/features/auth/signed-in-home";
import {buildPageMetadata} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {redirect} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

type SignUpPageProps = {
  params: Promise<{locale: AppLocale}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: SignUpPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Auth"});

  return buildPageMetadata({
    locale,
    title: t("signUpTitle"),
    description: t("signUpIntro"),
    hrefForLocale: () => "/sign-up",
    robots: {index: false, follow: false},
  });
}

export default async function SignUpPage({params}: SignUpPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");
  const viewer = await getViewer();

  if (viewer) {
    redirect({
      href: signedInHomePath(viewer),
      locale,
    });
  }

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="mt-3 font-serif text-heading">{t("signUpTitle")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
          {t("signUpIntro")}
        </p>
        <div className="mt-10">
          <SignUpForm locale={locale} />
        </div>
      </Section>
    </SiteShell>
  );
}

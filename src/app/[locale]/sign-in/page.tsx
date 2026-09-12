import {getTranslations, setRequestLocale} from "next-intl/server";

import {AuthAlert} from "@/features/auth/components/auth-field";
import {SignInForm} from "@/features/auth/components/sign-in-form";
import {getViewer} from "@/features/auth/require";
import {safeInternalPath} from "@/features/auth/redirect-path";
import {signedInHomePath} from "@/features/auth/signed-in-home";
import {buildPageMetadata} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link, redirect} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {Eyebrow, Section} from "@/shared/ui/layout";

type SignInPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{next?: string; verify?: string}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: SignInPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Auth"});

  return buildPageMetadata({
    locale,
    title: t("signInTitle"),
    description: t("signInIntro"),
    hrefForLocale: () => "/sign-in",
    robots: {index: false, follow: false},
  });
}

export default async function SignInPage({params, searchParams}: SignInPageProps) {
  const {locale} = await params;
  const {next, verify} = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");
  const viewer = await getViewer();
  const nextPath = safeInternalPath(next, locale);

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
        <h1 className="mt-3 font-serif text-heading">{t("signInTitle")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
          {t("signInIntro")}
        </p>
        {verify === "invalid" ? (
          <div className="mt-6 max-w-xl space-y-3">
            <AuthAlert>{t("errors.verifyInvalid")}</AuthAlert>
            <p className="text-sm leading-7 text-ink-muted">{t("verifyFailedHint")}</p>
          </div>
        ) : null}
        <div className="mt-10">
          <SignInForm locale={locale} nextPath={nextPath} />
        </div>
        <div className="mt-10 max-w-xl rounded-panel border border-ink bg-white p-5">
          <h2 className="font-serif text-subheading">{t("signUpTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">{t("signInCreatePrompt")}</p>
          <Link href="/sign-up" className={`${buttonStyles({size: "lg"})} mt-5`}>
            {t("signUpSubmit")}
          </Link>
        </div>
      </Section>
    </SiteShell>
  );
}

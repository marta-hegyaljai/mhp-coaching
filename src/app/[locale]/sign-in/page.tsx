import {getTranslations, setRequestLocale} from "next-intl/server";

import {SignInForm} from "@/features/auth/components/sign-in-form";
import {getViewer} from "@/features/auth/require";
import {safeInternalPath} from "@/features/auth/redirect-path";
import {buildPageMetadata} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {redirect} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

type SignInPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{next?: string}>;
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
  const {next} = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");
  const viewer = await getViewer();
  const nextPath = safeInternalPath(next, locale);

  if (viewer) {
    redirect({
      href: viewer.isAdmin ? "/admin/users" : viewer.canAccessRooms ? "/rooms" : "/",
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
        <div className="mt-10">
          <SignInForm locale={locale} nextPath={nextPath} />
        </div>
      </Section>
    </SiteShell>
  );
}

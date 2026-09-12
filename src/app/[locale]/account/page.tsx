import {getTranslations, setRequestLocale} from "next-intl/server";

import {ChangePasswordForm, ProfileForm} from "@/features/auth/components/account-forms";
import {AuthNotice} from "@/features/auth/components/auth-field";
import {AccountNav} from "@/features/auth/components/account-nav";
import {requireSignedInUser} from "@/features/auth/require";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

type AccountPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{verified?: string | string[]}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AccountPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Auth"});

  return buildPageMetadata({
    locale,
    title: t("profileTitle"),
    description: t("profileIntro"),
    hrefForLocale: () => "/account",
    robots: {index: false, follow: false},
  });
}

export default async function AccountPage({params, searchParams}: AccountPageProps) {
  const {locale} = await params;
  const verifiedParam = (await searchParams).verified;
  const verified = Array.isArray(verifiedParam) ? verifiedParam[0] : verifiedParam;
  setRequestLocale(locale);
  const user = await requireSignedInUser(locale, localizedPath(locale, "/account"));
  const t = await getTranslations("Auth");
  const navT = await getTranslations("Nav");

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="mt-3 font-serif text-heading">{t("profileTitle")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
          {t("profileIntro")}
        </p>
        {verified === "1" ? (
          <div className="mt-6 max-w-xl">
            <AuthNotice>{t("emailConfirmedNotice")}</AuthNotice>
          </div>
        ) : null}
        <AccountNav
          locale={locale}
          labels={{
            profile: t("profileTitle"),
            courses: t("myCoursesLink"),
            signOut: navT("signOut"),
          }}
        />
        <div className="mt-10">
          <h2 className="font-serif text-subheading">{t("profileSection")}</h2>
          <div className="mt-6">
            <ProfileForm locale={locale} user={user} />
          </div>
        </div>
        <div className="mt-14">
          <h2 className="font-serif text-subheading">{t("passwordSection")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
            {t("passwordIntro")}
          </p>
          <div className="mt-6">
            <ChangePasswordForm locale={locale} />
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}

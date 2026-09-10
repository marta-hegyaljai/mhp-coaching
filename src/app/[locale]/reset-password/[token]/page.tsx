import {getTranslations, setRequestLocale} from "next-intl/server";

import {ResetPasswordForm} from "@/features/auth/components/reset-password-form";
import {findValidAuthToken} from "@/features/auth/repository";
import {hashToken} from "@/features/auth/tokens";
import {buildPageMetadata} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

type ResetPasswordPageProps = {
  params: Promise<{locale: AppLocale; token: string}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: ResetPasswordPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Auth"});

  return buildPageMetadata({
    locale,
    title: t("resetTitle"),
    description: t("resetIntro"),
    hrefForLocale: () => "/forgot-password",
    robots: {index: false, follow: false},
  });
}

export default async function ResetPasswordPage({params}: ResetPasswordPageProps) {
  const {locale, token} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");
  const reset = token ? await findValidAuthToken(hashToken(token), "recovery") : undefined;

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="mt-3 font-serif text-heading">{t("resetTitle")}</h1>
        {reset ? (
          <>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
              {t("resetIntro")}
            </p>
            <div className="mt-10">
              <ResetPasswordForm locale={locale} token={token} />
            </div>
          </>
        ) : (
          <p className="mt-6 max-w-2xl text-sm leading-7 text-ink-muted">
            {t("errors.resetInvalid")}
          </p>
        )}
      </Section>
    </SiteShell>
  );
}

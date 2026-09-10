import {getTranslations, setRequestLocale} from "next-intl/server";

import {verifyEmailAction} from "@/features/auth/actions";
import {TokenConfirmForm} from "@/features/auth/components/token-confirm-form";
import {findValidAuthToken} from "@/features/auth/repository";
import {hashToken} from "@/features/auth/tokens";
import {buildPageMetadata} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

type VerifyEmailPageProps = {
  params: Promise<{locale: AppLocale; token: string}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: VerifyEmailPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Auth"});

  return buildPageMetadata({
    locale,
    title: t("verifyTitle"),
    description: t("verifyIntro"),
    hrefForLocale: () => "/sign-in",
    robots: {index: false, follow: false},
  });
}

export default async function VerifyEmailPage({params}: VerifyEmailPageProps) {
  const {locale, token} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");
  const usable = token ? await findValidAuthToken(hashToken(token), "verify") : undefined;

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="mt-3 font-serif text-heading">{t("verifyTitle")}</h1>
        {usable ? (
          <>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
              {t("verifyIntro")}
            </p>
            <div className="mt-10">
              <TokenConfirmForm
                locale={locale}
                token={token}
                action={verifyEmailAction}
                submitLabel={t("verifySubmit")}
                submittingLabel={t("verifySubmitting")}
              />
            </div>
          </>
        ) : (
          <p className="mt-6 max-w-2xl text-sm leading-7 text-ink-muted">
            {t("errors.verifyInvalid")}{" "}
            <Link href="/sign-in" className="text-ink underline-offset-4 hover:underline">
              {t("signInLink")}
            </Link>
          </p>
        )}
      </Section>
    </SiteShell>
  );
}

import {getTranslations, setRequestLocale} from "next-intl/server";

import {AcceptInviteForm} from "@/features/auth/components/accept-invite-form";
import {findUserById, findValidInviteToken} from "@/features/auth/repository";
import {hashToken} from "@/features/auth/tokens";
import {buildPageMetadata} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

type InvitePageProps = {
  params: Promise<{locale: AppLocale; token: string}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: InvitePageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Auth"});

  return buildPageMetadata({
    locale,
    title: t("inviteTitle"),
    description: t("inviteIntro"),
    hrefForLocale: () => "/sign-in",
    robots: {index: false, follow: false},
  });
}

export default async function InvitePage({params}: InvitePageProps) {
  const {locale, token} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");
  const invite = token ? await findValidInviteToken(hashToken(token)) : undefined;
  const user = invite ? await findUserById(invite.userId) : undefined;
  const usable = Boolean(invite && user && !user.disabledAt);

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="mt-3 font-serif text-heading">{t("inviteTitle")}</h1>
        {usable ? (
          <>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
              {t("inviteIntro")}
            </p>
            <div className="mt-10">
              <AcceptInviteForm locale={locale} token={token} />
            </div>
          </>
        ) : (
          <p className="mt-6 max-w-2xl text-sm leading-7 text-ink-muted">
            {t("errors.inviteInvalid")}
          </p>
        )}
      </Section>
    </SiteShell>
  );
}

import {getTranslations} from "next-intl/server";

import type {User} from "@/db/schema";
import {composeTransactionalEmail} from "@/features/email/layout";
import {mailLocale} from "@/features/email/locale";
import {sendMail} from "@/features/email/transport";
import {localizedPathname} from "@/i18n/path";
import type {AppLocale} from "@/i18n/routing";
import {getAppUrl} from "@/lib/site-url";

export async function sendAccountInvitation(input: {
  user: User;
  locale: AppLocale;
  rawToken: string;
}): Promise<void> {
  const locale = mailLocale(input.locale);
  const t = await getTranslations({locale, namespace: "Email.invitation"});
  const fields = await getTranslations({locale, namespace: "Email.fields"});
  const setupPath = localizedPathname(locale, {
    pathname: "/invite/[token]",
    params: {token: input.rawToken},
  });
  const setupUrl = new URL(setupPath, getAppUrl()).toString();
  const greeting = t("greeting", {name: input.user.firstName});
  const text = [
    greeting,
    "",
    t("intro"),
    "",
    t("linkLine", {url: setupUrl}),
    "",
    t("closing"),
  ].join("\n");

  const html = composeTransactionalEmail({
    locale,
    preheader: t("intro"),
    eyebrow: t("eyebrow"),
    title: t("title"),
    greeting,
    intro: t("intro"),
    details: [{label: fields("link"), value: setupUrl, href: setupUrl}],
    closing: t("closing"),
  });

  await sendMail({
    to: input.user.email,
    subject: t("subject"),
    text,
    html,
  });
}

import {getTranslations} from "next-intl/server";

import {composeTransactionalEmail} from "@/features/email/layout";
import {mailLocale} from "@/features/email/locale";
import {sendMail} from "@/features/email/transport";
import {localizedPathname} from "@/i18n/path";
import type {AppLocale} from "@/i18n/routing";
import {getSiteUrl} from "@/lib/site-url";

async function sendTokenEmail(input: {
  to: string;
  name: string;
  locale: AppLocale;
  namespace: "Email.verification" | "Email.recovery";
  pathname: "/verify-email/[token]" | "/reset-password/[token]";
  rawToken: string;
}): Promise<void> {
  const locale = mailLocale(input.locale);
  const t = await getTranslations({locale, namespace: input.namespace});
  const fields = await getTranslations({locale, namespace: "Email.fields"});
  const path = localizedPathname(locale, {
    pathname: input.pathname,
    params: {token: input.rawToken},
  });
  const url = new URL(path, getSiteUrl()).toString();
  const greeting = t("greeting", {name: input.name});
  const text = [
    greeting,
    "",
    t("intro"),
    "",
    t("linkLine", {url}),
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
    details: [{label: fields("link"), value: url, href: url}],
    closing: t("closing"),
  });

  await sendMail({
    to: input.to,
    subject: t("subject"),
    text,
    html,
  });
}

export async function sendEmailVerification(input: {
  to: string;
  firstName: string;
  locale: AppLocale;
  rawToken: string;
}): Promise<void> {
  await sendTokenEmail({
    to: input.to,
    name: input.firstName,
    locale: input.locale,
    namespace: "Email.verification",
    pathname: "/verify-email/[token]",
    rawToken: input.rawToken,
  });
}

export async function sendPasswordRecovery(input: {
  to: string;
  firstName: string;
  locale: AppLocale;
  rawToken: string;
}): Promise<void> {
  await sendTokenEmail({
    to: input.to,
    name: input.firstName,
    locale: input.locale,
    namespace: "Email.recovery",
    pathname: "/reset-password/[token]",
    rawToken: input.rawToken,
  });
}


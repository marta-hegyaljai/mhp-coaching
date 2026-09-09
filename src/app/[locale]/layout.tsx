import type {Metadata, Viewport} from "next";
import {Cormorant_Garamond, Source_Sans_3} from "next/font/google";
import {hasLocale, NextIntlClientProvider} from "next-intl";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import type {ReactNode} from "react";
import {Analytics} from "@vercel/analytics/next";

import {JsonLd} from "@/features/seo/json-ld-script";
import {organizationJsonLd, websiteJsonLd} from "@/features/seo/json-ld";
import {routing} from "@/i18n/routing";
import {getSiteUrl} from "@/lib/site-url";

import "../globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-serif-family",
  display: "swap",
});

const sans = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-family",
  display: "swap",
});

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{locale: string}>;
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({
  params,
}: Pick<LocaleLayoutProps, "params">): Promise<Metadata> {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const t = await getTranslations({locale, namespace: "Metadata"});

  return {
    metadataBase: getSiteUrl(),
    title: {
      default: t("title"),
      template: `%s | ${t("siteName")}`,
    },
    description: t("description"),
    openGraph: {
      siteName: t("siteName"),
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      // Smooth scrolling is intentional for in-page anchors; Next needs this
      // flag to keep route transitions instant.
      data-scroll-behavior="smooth"
      className={`${serif.variable} ${sans.variable}`}
    >
      <body>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd(locale)} />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}

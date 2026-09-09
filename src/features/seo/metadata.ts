import type {Metadata} from "next";

import type {PathnameHref} from "@/i18n/href";
import {localizedPathname} from "@/i18n/path";
import {routing, type AppLocale} from "@/i18n/routing";
import {getSiteUrl} from "@/lib/site-url";

const openGraphLocale: Record<AppLocale, string> = {
  fr: "fr_CH",
  de: "de_CH",
  en: "en_GB",
};

export function localizedPath(locale: AppLocale, href: PathnameHref): string {
  return localizedPathname(locale, href);
}

export function absoluteUrl(pathname: string): string {
  return new URL(pathname, getSiteUrl()).toString();
}

export function languageAlternates(
  hrefForLocale: (locale: AppLocale) => PathnameHref,
) {
  const languages: Record<string, string> = {
    "x-default": absoluteUrl(localizedPath("fr", hrefForLocale("fr"))),
  };

  for (const locale of routing.locales) {
    languages[locale] = absoluteUrl(localizedPath(locale, hrefForLocale(locale)));
  }

  return languages;
}

export function buildPageMetadata(input: {
  locale: AppLocale;
  title: string;
  description: string;
  hrefForLocale: (locale: AppLocale) => PathnameHref;
  robots?: Metadata["robots"];
  image?: {
    url: string;
    width: number;
    height: number;
    alt: string;
  };
}): Metadata {
  const canonical = absoluteUrl(
    localizedPath(input.locale, input.hrefForLocale(input.locale)),
  );
  const languages = languageAlternates(input.hrefForLocale);
  const image = input.image
    ? {
        url: absoluteUrl(input.image.url),
        width: input.image.width,
        height: input.image.height,
        alt: input.image.alt,
      }
    : undefined;

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
      languages,
    },
    robots: input.robots,
    openGraph: {
      type: "website",
      locale: openGraphLocale[input.locale],
      siteName: "mhp-coaching",
      title: input.title,
      description: input.description,
      url: canonical,
      images: image ? [image] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary_large_image",
      title: input.title,
      description: input.description,
      images: image ? [image.url] : undefined,
    },
  };
}

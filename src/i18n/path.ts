import {routing, type AppLocale} from "@/i18n/routing";

import type {PathnameHref} from "./href";

export function localizedPathname(
  locale: AppLocale,
  href: PathnameHref,
): string {
  if (typeof href === "string") {
    return withLocalePrefix(locale, externalPath(locale, href));
  }

  let path = externalPath(locale, href.pathname);

  for (const [key, value] of Object.entries(href.params)) {
    path = path.replaceAll(`[${key}]`, encodeURIComponent(String(value)));
  }

  return withLocalePrefix(locale, path);
}

function externalPath(locale: AppLocale, pathname: string): string {
  const config = routing.pathnames[pathname as keyof typeof routing.pathnames];

  if (!config) {
    return pathname;
  }

  if (typeof config === "string") {
    return config;
  }

  return config[locale] ?? pathname;
}

function withLocalePrefix(locale: AppLocale, path: string): string {
  if (path === "/") {
    return `/${locale}`;
  }

  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

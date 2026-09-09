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

  if ("params" in href) {
    for (const [key, value] of Object.entries(href.params)) {
      path = path.replaceAll(`[${key}]`, encodeURIComponent(String(value)));
    }
  }

  const prefix = withLocalePrefix(locale, path);
  const query =
    "query" in href && href.query
      ? new URLSearchParams(
          Object.entries(href.query).flatMap(([key, value]) =>
            value ? [[key, value]] : [],
          ),
        )
      : null;
  const search =
    query && [...query.keys()].length > 0 ? `?${query.toString()}` : "";

  return `${prefix}${search}`;
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

import {headers} from "next/headers";
import type {ReactNode} from "react";

import type {PathnameHref} from "@/i18n/href";
import {Link} from "@/i18n/navigation";
import {localizedPathname} from "@/i18n/path";
import type {AppLocale} from "@/i18n/routing";
import {
  classifyRequestHost,
  getSplitOrigins,
  requestHost,
  type OriginKind,
} from "@/lib/origins";

export async function OriginLink({
  locale,
  href,
  origin,
  className,
  children,
  "aria-label": ariaLabel,
}: {
  locale: AppLocale;
  href: PathnameHref;
  origin: OriginKind;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  const split = getSplitOrigins();
  if (!split) {
    return (
      <Link href={href} className={className} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  const host = requestHost(await headers());
  const current = classifyRequestHost(host, split);
  if (current === origin || current === "unknown") {
    return (
      <Link href={href} className={className} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  const path = localizedPathname(locale, href);
  const base = origin === "app" ? split.app : split.marketing;
  return (
    <a href={new URL(path, base).toString()} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  );
}

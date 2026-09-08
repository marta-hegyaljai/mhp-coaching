import type {ReactNode} from "react";

import type {PathnameHref} from "@/i18n/href";
import type {AppLocale} from "@/i18n/routing";

import {SiteHeader} from "./header";
import {SiteFooter, type FooterCta} from "./site-footer";

export async function SiteShell({
  locale,
  children,
  hreflangs,
  footerCta,
  bottomBar,
}: {
  locale: AppLocale;
  children: ReactNode;
  hreflangs?: Partial<Record<AppLocale, PathnameHref>>;
  /** Omit for the default course call to action, `null` to drop the band. */
  footerCta?: FooterCta | null;
  /** Sticky mobile action bar; the shell reserves the space it covers. */
  bottomBar?: ReactNode;
}) {
  return (
    <div
      className={`flex min-h-screen flex-col ${bottomBar ? "pb-24 lg:pb-0" : ""}`}
    >
      <SiteHeader locale={locale} hreflangs={hreflangs} />
      <main className="flex-1">{children}</main>
      <SiteFooter locale={locale} cta={footerCta} />
      {bottomBar}
    </div>
  );
}

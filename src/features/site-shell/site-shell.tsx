import {getTranslations} from "next-intl/server";
import {Suspense, type ReactNode} from "react";

import type {PathnameHref} from "@/i18n/href";
import type {AppLocale} from "@/i18n/routing";

import {SiteHeader} from "./header";
import {NavigationFeedback} from "./navigation-feedback";
import {SiteFooter, type FooterCta} from "./site-footer";

export async function SiteShell({
  locale,
  children,
  hreflangs,
  footerCta,
  bottomBar,
  fillViewport = false,
}: {
  locale: AppLocale;
  children: ReactNode;
  hreflangs?: Partial<Record<AppLocale, PathnameHref>>;
  /** Omit for the default course call to action, `null` to drop the band. */
  footerCta?: FooterCta | null;
  /** Sticky mobile action bar; the shell reserves the space it covers. */
  bottomBar?: ReactNode;
  /**
   * Lock the document to the viewport and omit the footer so an operational
   * board can fill the remaining height without the page itself scrolling.
   */
  fillViewport?: boolean;
}) {
  const t = await getTranslations({locale, namespace: "Nav"});

  return (
    <div
      className={
        fillViewport
          ? "flex h-dvh max-h-dvh flex-col overflow-hidden overscroll-none"
          : `flex min-h-screen flex-col overflow-x-clip ${bottomBar ? "pb-24 lg:pb-0" : ""}`
      }
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-parchment focus:outline-2 focus:outline-offset-2 focus:outline-gold"
      >
        {t("skipToContent")}
      </a>
      <Suspense fallback={null}>
        <NavigationFeedback locale={locale} />
      </Suspense>
      <SiteHeader locale={locale} hreflangs={hreflangs} />
      <main
        id="main-content"
        tabIndex={-1}
        className={fillViewport ? "flex min-h-0 flex-1 flex-col overflow-hidden" : "flex-1"}
      >
        {children}
      </main>
      {fillViewport ? null : <SiteFooter locale={locale} cta={footerCta} />}
      {bottomBar}
    </div>
  );
}

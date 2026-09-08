import {getTranslations} from "next-intl/server";

import type {PathnameHref} from "@/i18n/href";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Container} from "@/shared/ui/layout";

import {LanguageSwitcher} from "./language-switcher";

const navLink =
  "inline-flex min-h-11 items-center justify-center border-b-2 border-transparent px-2 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors duration-150 hover:border-ink";

export async function SiteHeader({
  locale,
  hreflangs,
}: {
  locale: AppLocale;
  hreflangs?: Partial<Record<AppLocale, PathnameHref>>;
}) {
  const t = await getTranslations({locale, namespace: "Nav"});

  return (
    <header className="sticky top-0 z-40 border-b border-ink bg-ivory/95 backdrop-blur-sm">
      <Container className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-x-4 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-4 sm:gap-8">
          <Link
            href="/"
            className="shrink-0 font-serif text-xl font-semibold tracking-[0.03em] whitespace-nowrap transition-opacity duration-150 hover:opacity-60"
          >
            mhp-coaching
          </Link>
          <nav aria-label={t("label")} className="hidden items-center gap-3 sm:flex">
            <Link href="/courses" className={navLink}>
              {t("courses")}
            </Link>
            <Link href="/contact" className={navLink}>
              {t("contact")}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher hreflangs={hreflangs} />
          <div className="hidden lg:block">
            <Link href="/courses" className={`${buttonStyles()} min-w-40`}>
              {t("cta")}
              <ArrowRightIcon className="transition-transform duration-150 ease-standard group-hover/button:translate-x-1" />
            </Link>
          </div>
        </div>

        <nav
          aria-label={t("label")}
          className="col-span-2 grid grid-cols-2 border-t border-line-soft sm:hidden"
        >
          <Link href="/courses" className={navLink}>
            {t("courses")}
          </Link>
          <Link href="/contact" className={`${navLink} border-l border-line-soft`}>
            {t("contact")}
          </Link>
        </nav>
      </Container>
    </header>
  );
}

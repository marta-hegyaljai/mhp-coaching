import {getTranslations} from "next-intl/server";

import type {PathnameHref} from "@/i18n/href";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Container} from "@/shared/ui/layout";

import {LanguageSwitcher} from "./language-switcher";

const navLink =
  "inline-flex min-h-11 items-center px-2 text-sm text-ink-muted transition-colors duration-200 hover:text-bronze";

export async function SiteHeader({
  locale,
  hreflangs,
}: {
  locale: AppLocale;
  hreflangs?: Partial<Record<AppLocale, PathnameHref>>;
}) {
  const t = await getTranslations({locale, namespace: "Nav"});

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory">
      <Container className="flex min-h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="font-serif text-xl tracking-[0.06em] whitespace-nowrap transition-colors duration-200 hover:text-bronze"
        >
          mhp | hypnose
        </Link>
        <div className="flex items-center gap-1 sm:gap-3">
          <nav
            aria-label={t("label")}
            className="hidden items-center gap-1 sm:flex"
          >
            <Link href="/courses" className={navLink}>
              {t("courses")}
            </Link>
            <Link href="/contact" className={navLink}>
              {t("contact")}
            </Link>
          </nav>
          <LanguageSwitcher hreflangs={hreflangs} />
          {/* Wrapper owns the responsive display so it cannot collide with the
              button's own `inline-flex`. */}
          <div className="hidden lg:block">
            <Link href="/courses" className={buttonStyles()}>
              {t("cta")}
              <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
}

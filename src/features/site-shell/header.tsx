import {getTranslations} from "next-intl/server";

import type {PathnameHref} from "@/i18n/href";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Container} from "@/shared/ui/layout";

import {LanguageSwitcher} from "./language-switcher";

const navLink =
  "inline-flex min-h-11 items-center justify-center border-b-2 border-transparent px-1.5 text-[0.7rem] font-bold uppercase tracking-[0.06em] text-ink whitespace-nowrap transition-colors duration-150 hover:border-ink sm:px-2 sm:text-xs sm:tracking-[0.12em]";

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
      <Container className="flex min-h-14 items-center justify-between gap-3 sm:min-h-16">
        <Link
          href="/"
          aria-label="MHP Coaching"
          className="flex shrink-0 items-center whitespace-nowrap font-sans text-ink transition-opacity duration-150 hover:opacity-60"
        >
          <span className="text-lg font-black tracking-[-0.06em] sm:text-xl">
            MHP
          </span>
          <span
            aria-hidden="true"
            className="mx-2.5 hidden h-7 border-l border-ink sm:mx-3 sm:inline-block sm:h-8"
          />
          <span className="hidden text-lg font-normal tracking-[-0.035em] sm:inline sm:text-xl">
            Coaching
          </span>
        </Link>
        <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-3">
          <nav aria-label={t("label")} className="flex items-center">
            <Link href="/courses" className={navLink}>
              {t("courses")}
            </Link>
            <Link href="/contact" className={navLink}>
              {t("contact")}
            </Link>
          </nav>
          <LanguageSwitcher hreflangs={hreflangs} />
          <div className="hidden lg:block">
            <Link href="/courses" className={`${buttonStyles()} min-w-40`}>
              {t("cta")}
              <ArrowRightIcon className="transition-transform duration-150 ease-standard group-hover/button:translate-x-1" />
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
}

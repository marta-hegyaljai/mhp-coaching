import {getTranslations} from "next-intl/server";

import type {PathnameHref} from "@/i18n/href";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Container} from "@/shared/ui/layout";

import {LANGUAGE_SWITCHER_ENABLED} from "./locale-ui";
import {LanguageSwitcher} from "./language-switcher";

const navLink =
  "inline-flex h-14 shrink-0 items-center px-2 text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-ink whitespace-nowrap transition-opacity duration-150 hover:opacity-60 sm:h-16 sm:px-2.5 sm:text-xs sm:tracking-[0.1em]";

export async function SiteHeader({
  locale,
  hreflangs,
}: {
  locale: AppLocale;
  hreflangs?: Partial<Record<AppLocale, PathnameHref>>;
}) {
  const t = await getTranslations({locale, namespace: "Nav"});

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-ink bg-ivory/95 backdrop-blur-sm sm:h-16">
      <Container className="flex h-full flex-nowrap items-center justify-between gap-2 overflow-x-clip sm:gap-4">
        <Link
          href="/"
          aria-label="MHP Coaching"
          className="flex h-full min-w-0 shrink-0 items-center whitespace-nowrap font-sans text-ink transition-opacity duration-150 hover:opacity-60"
        >
          <span className="text-base font-black tracking-[-0.06em] sm:text-lg md:text-xl">
            MHP
          </span>
          <span
            aria-hidden="true"
            className="mx-2.5 hidden h-6 border-l border-ink md:mx-3 md:inline-block md:h-8"
          />
          <span className="hidden text-lg font-normal tracking-[-0.035em] md:inline md:text-xl">
            Coaching
          </span>
        </Link>
        <div className="flex h-full min-w-0 shrink-0 items-center justify-end">
          <nav aria-label={t("label")} className="flex h-full items-center">
            <Link href="/courses" className={navLink}>
              {t("courses")}
            </Link>
            <Link href="/contact" className={navLink}>
              {t("contact")}
            </Link>
          </nav>
          {LANGUAGE_SWITCHER_ENABLED ? (
            <LanguageSwitcher hreflangs={hreflangs} />
          ) : null}
          <div className="ml-3 hidden lg:block">
            <Link href="/book" className={`${buttonStyles()} min-w-40`}>
              {t("cta")}
              <ArrowRightIcon className="transition-transform duration-150 ease-standard group-hover/button:translate-x-1" />
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
}

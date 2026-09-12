import {getTranslations} from "next-intl/server";

import {getViewer} from "@/features/auth/require";
import {
  catalogueCalendarHref,
  catalogueListHref,
  type PathnameHref,
} from "@/i18n/href";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Container} from "@/shared/ui/layout";

import {AccountMenu} from "./account-menu";
import {DesktopNav} from "./desktop-nav";
import {GuestAuthAction} from "./guest-auth-action";
import {LanguageSwitcher} from "./language-switcher";
import {LANGUAGE_SWITCHER_ENABLED} from "./locale-ui";
import {MenuPanel} from "./menu-panel";
import {MobileMenu} from "./mobile-menu";
import {NavCurrent} from "./nav-current";
import {primaryNavEntries} from "./nav-model";
import {OriginLink} from "./origin-link";

/**
 * One header for visitors, signed-in people and the installed app. Product
 * navigation, the account control and the booking call to action are three
 * distinct zones; below `lg` the navigation collapses into a sheet while the
 * call to action stays in the bar.
 */
export async function SiteHeader({
  locale,
  hreflangs,
}: {
  locale: AppLocale;
  hreflangs?: Partial<Record<AppLocale, PathnameHref>>;
}) {
  const t = await getTranslations({locale, namespace: "Nav"});
  const viewer = await getViewer();
  const entries = primaryNavEntries(viewer);
  // Signed-in people go straight to the bookable list; visitors keep the
  // calendar entry point that the public catalogue is built around.
  const cta = viewer
    ? {
        href: catalogueListHref,
        label: t("datesAndRegistration"),
        shortLabel: t("datesShort"),
      }
    : {href: catalogueCalendarHref, label: t("cta"), shortLabel: t("ctaShort")};

  return (
    <header className="sticky top-0 z-40 border-b border-ink bg-ivory/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm [--mhp-header-height:calc(3.5rem+env(safe-area-inset-top))] sm:[--mhp-header-height:calc(4rem+env(safe-area-inset-top))]">
      <Container className="flex h-14 flex-nowrap items-center justify-between gap-2 overflow-x-clip sm:h-16 sm:gap-4">
        <NavCurrent match="/" activeClassName="">
          <OriginLink
            locale={locale}
            origin="marketing"
            href="/"
            aria-label="MHP Coaching"
            className="flex min-w-0 shrink-0 items-center whitespace-nowrap font-sans text-ink transition-opacity duration-150 hover:opacity-60"
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
          </OriginLink>
        </NavCurrent>

        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <DesktopNav locale={locale} entries={entries} />

          <span
            aria-hidden="true"
            className="mx-1 hidden h-7 w-px bg-line-soft lg:block"
          />

          <div className="hidden items-center gap-2 lg:flex">
            {viewer ? (
              <AccountMenu locale={locale} viewer={viewer} />
            ) : (
              <GuestAuthAction />
            )}
          </div>

          {LANGUAGE_SWITCHER_ENABLED ? (
            <LanguageSwitcher hreflangs={hreflangs} />
          ) : null}

          <OriginLink
            locale={locale}
            origin="marketing"
            href={cta.href}
            className={`${buttonStyles()} px-3 sm:px-5`}
          >
            <span className="sm:hidden">{cta.shortLabel}</span>
            <span className="hidden sm:inline">{cta.label}</span>
            <ArrowRightIcon className="transition-transform duration-150 ease-standard group-hover/button:translate-x-1" />
          </OriginLink>

          <MobileMenu openLabel={t("openMenu")} closeLabel={t("closeMenu")}>
            <MenuPanel locale={locale} viewer={viewer} hreflangs={hreflangs} />
          </MobileMenu>
        </div>
      </Container>
    </header>
  );
}

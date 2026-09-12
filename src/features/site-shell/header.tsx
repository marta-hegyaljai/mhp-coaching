import {getTranslations} from "next-intl/server";

import {getViewer} from "@/features/auth/require";
import {catalogueCalendarHref, type PathnameHref} from "@/i18n/href";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Container} from "@/shared/ui/layout";

import {AccountMenu} from "./account-menu";
import {LANGUAGE_SWITCHER_ENABLED} from "./locale-ui";
import {LanguageSwitcher} from "./language-switcher";
import {NavCurrent} from "./nav-current";
import {OriginLink} from "./origin-link";

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
  const viewer = await getViewer();

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-ink bg-ivory/95 backdrop-blur-sm sm:h-16">
      <Container className="flex h-full flex-nowrap items-center justify-between gap-2 overflow-x-clip sm:gap-4">
        <NavCurrent match="/">
          <OriginLink
            locale={locale}
            origin="marketing"
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
          </OriginLink>
        </NavCurrent>
        <div className="flex h-full min-w-0 shrink-0 items-center justify-end">
          <nav aria-label={t("label")} className="flex h-full items-center">
            <NavCurrent match="/courses">
              <OriginLink locale={locale} origin="marketing" href="/courses" className={navLink}>
                {t("courses")}
              </OriginLink>
            </NavCurrent>
            <NavCurrent match="/contact">
              <OriginLink locale={locale} origin="marketing" href="/contact" className={navLink}>
                {t("contact")}
              </OriginLink>
            </NavCurrent>
            {viewer?.isAdmin ? (
              <NavCurrent match="/admin">
                <OriginLink locale={locale} origin="app" href="/admin/users" className={navLink}>
                  {t("admin")}
                </OriginLink>
              </NavCurrent>
            ) : null}
            {viewer?.canAccessRooms ? (
              <NavCurrent match="/rooms">
                <OriginLink locale={locale} origin="app" href="/rooms" className={navLink}>
                  {t("rooms")}
                </OriginLink>
              </NavCurrent>
            ) : null}
            {viewer ? (
              <AccountMenu locale={locale} viewer={viewer} />
            ) : (
              <>
                <NavCurrent match="/sign-in">
                  <OriginLink locale={locale} origin="app" href="/sign-in" className={navLink}>
                    {t("signIn")}
                  </OriginLink>
                </NavCurrent>
                <NavCurrent match="/sign-up">
                  <OriginLink locale={locale} origin="app" href="/sign-up" className={navLink}>
                    {t("signUp")}
                  </OriginLink>
                </NavCurrent>
              </>
            )}
          </nav>
          {LANGUAGE_SWITCHER_ENABLED ? (
            <LanguageSwitcher hreflangs={hreflangs} />
          ) : null}
          <div className="ml-3 hidden lg:block">
            <OriginLink
              locale={locale}
              origin="marketing"
              href={catalogueCalendarHref}
              className={`${buttonStyles()} min-w-40`}
            >
              {t("cta")}
              <ArrowRightIcon className="transition-transform duration-150 ease-standard group-hover/button:translate-x-1" />
            </OriginLink>
          </div>
        </div>
      </Container>
    </header>
  );
}

import {getTranslations} from "next-intl/server";

import {signOutAction} from "@/features/auth/actions";
import type {Viewer} from "@/features/auth/require";
import type {PathnameHref} from "@/i18n/href";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon} from "@/shared/ui/icons";

import {GuestAuthAction} from "./guest-auth-action";
import {displayName, personInitials} from "./identity";
import {LanguageSwitcher} from "./language-switcher";
import {LANGUAGE_SWITCHER_ENABLED} from "./locale-ui";
import {NavCurrent} from "./nav-current";
import {accountNavEntries, primaryNavEntries, type NavEntry} from "./nav-model";
import {OriginLink} from "./origin-link";

const sectionLabel =
  "px-3 pb-1 text-[0.65rem] font-bold tracking-[0.18em] text-ink-subtle uppercase";

const row =
  "flex min-h-13 items-center justify-between gap-3 rounded-panel px-3 text-base font-medium text-ink transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink";

/**
 * Contents of the phone navigation sheet. Product sections sit at the top
 * under the thumb path, personal actions stay grouped at the bottom edge.
 */
export async function MenuPanel({
  locale,
  viewer,
  hreflangs,
}: {
  locale: AppLocale;
  viewer: Viewer | null;
  hreflangs?: Partial<Record<AppLocale, PathnameHref>>;
}) {
  const t = await getTranslations({locale, namespace: "Nav"});

  return (
    <>
      {viewer ? (
        <div className="flex items-center gap-3 border-b border-line-soft px-5 py-4">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-panel bg-ink text-sm font-bold tracking-[0.04em] text-parchment"
          >
            {personInitials(viewer)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink">
              {displayName(viewer)}
            </span>
            <span className="block truncate text-xs leading-5 text-ink-muted">
              {viewer.email}
            </span>
          </span>
        </div>
      ) : null}

      <nav aria-label={t("label")} className="px-2 pt-4">
        <p className={sectionLabel}>{t("sections")}</p>
        <ul>
          {primaryNavEntries(viewer).map((entry) => (
            <li key={entry.key}>
              <MenuRow locale={locale} entry={entry} label={t(entry.key)} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto px-2 pt-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        {viewer ? (
          <nav aria-label={t("accountMenu")} className="border-t border-line-soft pt-4">
            <p className={sectionLabel}>{t("accountSection")}</p>
            <ul>
              {accountNavEntries.map((entry) => (
                <li key={entry.key}>
                  <MenuRow locale={locale} entry={entry} label={t(entry.key)} />
                </li>
              ))}
            </ul>
            <form action={signOutAction.bind(null, locale)} className="mt-3 px-1">
              <button
                type="submit"
                className={buttonStyles({variant: "secondary", size: "lg", block: true})}
              >
                {t("signOut")}
              </button>
            </form>
          </nav>
        ) : (
          <div className="border-t border-line-soft pt-4">
            <p className={sectionLabel}>{t("accountSection")}</p>
            <div className="px-1 pt-1">
              <GuestAuthAction block />
            </div>
          </div>
        )}

        {LANGUAGE_SWITCHER_ENABLED ? (
          <div className="mt-5 px-1">
            <LanguageSwitcher hreflangs={hreflangs} />
          </div>
        ) : null}
      </div>
    </>
  );
}

function MenuRow({
  locale,
  entry,
  label,
}: {
  locale: AppLocale;
  entry: NavEntry;
  label: string;
}) {
  return (
    <NavCurrent match={entry.match} exact={entry.exact}>
      <OriginLink
        locale={locale}
        origin={entry.origin}
        href={entry.href}
        className={row}
      >
        {label}
        <ArrowRightIcon className="text-ink-subtle" />
      </OriginLink>
    </NavCurrent>
  );
}

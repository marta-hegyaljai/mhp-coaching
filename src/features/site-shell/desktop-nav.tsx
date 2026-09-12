import {getTranslations} from "next-intl/server";

import type {AppLocale} from "@/i18n/routing";

import {NavCurrent} from "./nav-current";
import type {NavEntry} from "./nav-model";
import {OriginLink} from "./origin-link";

const navLink =
  "inline-flex h-9 shrink-0 items-center rounded-panel px-3 text-xs font-semibold tracking-[0.1em] whitespace-nowrap text-ink uppercase transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

/** Product sections on wide viewports. Personal account controls sit apart. */
export async function DesktopNav({
  locale,
  entries,
}: {
  locale: AppLocale;
  entries: NavEntry[];
}) {
  const t = await getTranslations({locale, namespace: "Nav"});

  return (
    <nav aria-label={t("label")} className="hidden items-center gap-0.5 lg:flex">
      {entries.map((entry) => (
        <NavCurrent key={entry.key} match={entry.match} exact={entry.exact}>
          <OriginLink
            locale={locale}
            origin={entry.origin}
            href={entry.href}
            className={navLink}
          >
            {t(entry.key)}
          </OriginLink>
        </NavCurrent>
      ))}
    </nav>
  );
}

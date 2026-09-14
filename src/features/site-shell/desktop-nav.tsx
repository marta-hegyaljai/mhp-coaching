import {getTranslations} from "next-intl/server";

import type {AppLocale} from "@/i18n/routing";

import {navChipClass} from "./nav-chip";
import {NavCurrent} from "./nav-current";
import {NavGroupMenu} from "./nav-group-menu";
import {isNavGroup, type NavNode} from "./nav-model";
import {OriginLink} from "./origin-link";

const menuRow =
  "flex min-h-11 flex-col justify-center gap-0.5 rounded-panel px-3 py-2 transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink";

/** Product sections on wide viewports. Personal account controls sit apart. */
export async function DesktopNav({
  locale,
  nodes,
}: {
  locale: AppLocale;
  nodes: NavNode[];
}) {
  const t = await getTranslations({locale, namespace: "Nav"});

  return (
    <nav aria-label={t("label")} className="hidden items-center gap-0.5 lg:flex">
      {nodes.map((node) =>
        isNavGroup(node) ? (
          <NavGroupMenu
            key={node.key}
            label={t(node.key)}
            matches={node.entries.map((entry) => entry.match)}
          >
            {node.entries.map((entry) => (
              <li key={entry.key}>
                <NavCurrent
                  match={entry.match}
                  exact={entry.exact}
                  activeClassName="[&_a]:font-semibold"
                >
                  <OriginLink
                    locale={locale}
                    origin={entry.origin}
                    href={entry.href}
                    className={menuRow}
                  >
                    <span className="text-sm font-medium text-ink">{t(entry.key)}</span>
                    {entry.hint ? (
                      <span className="text-xs leading-5 text-ink-muted">{t(entry.hint)}</span>
                    ) : null}
                  </OriginLink>
                </NavCurrent>
              </li>
            ))}
          </NavGroupMenu>
        ) : (
          <NavCurrent key={node.key} match={node.match} exact={node.exact}>
            <OriginLink
              locale={locale}
              origin={node.origin}
              href={node.href}
              className={navChipClass}
            >
              {t(node.key)}
            </OriginLink>
          </NavCurrent>
        ),
      )}
    </nav>
  );
}

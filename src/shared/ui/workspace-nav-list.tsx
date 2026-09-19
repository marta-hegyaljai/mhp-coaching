import {Link} from "@/i18n/navigation";

import type {WorkspaceNavModel} from "./workspace-nav";

const itemClass =
  "flex min-h-11 items-center border-l-2 px-3 text-sm font-semibold tracking-[0.02em] transition-colors duration-150 ease-standard";

/**
 * Destinations for one signed-in workspace. Selected state is a gold left
 * rail and gold type — the same language as the old admin tabs, not a filled
 * chip that would compete with the product header.
 */
export function WorkspaceNavList({
  nav,
  onNavigate,
}: {
  nav: WorkspaceNavModel;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label={nav.label} className="flex flex-col">
      {nav.items.map((item) => {
        const active = item.key === nav.current;

        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={`${itemClass} ${
              active
                ? "border-gold-deep bg-hover text-gold-deep"
                : "border-transparent text-ink-muted hover:bg-hover hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

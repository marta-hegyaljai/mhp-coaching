import Link from "next/link";

import {breadcrumbJsonLd} from "./json-ld";
import {JsonLd} from "./json-ld-script";

export type BreadcrumbItem = {
  name: string;
  /** Locale-prefixed path, as produced by `localizedPath`. */
  path: string;
};

/**
 * Renders the visible trail and its structured data from one list, so the
 * markup crawlers read can never drift from the links visitors see.
 */
export function BreadcrumbTrail({
  items,
  label,
}: {
  items: BreadcrumbItem[];
  label: string;
}) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items)} />
      <nav aria-label={label}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-subtle">
          {items.map((item, index) => {
            const isCurrent = index === items.length - 1;

            return (
              <li key={item.path} className="flex items-center gap-2">
                {isCurrent ? (
                  <span aria-current="page" className="text-ink-muted">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.path}
                    className="transition-colors duration-200 hover:text-bronze"
                  >
                    {item.name}
                  </Link>
                )}
                {isCurrent ? null : (
                  <span aria-hidden="true" className="text-line">
                    /
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

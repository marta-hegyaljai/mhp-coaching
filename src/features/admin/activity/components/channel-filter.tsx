import type {PathnameHref} from "@/i18n/href";
import {Link} from "@/i18n/navigation";

export type ChannelFilterItem = {
  key: string;
  label: string;
  count: number;
  href: PathnameHref;
  current: boolean;
};

/**
 * The control panel's primary navigation: one hairline cell per channel that
 * both answers "how much is there?" and filters the list to exactly that
 * count. Selection reads from the inverted surface and `aria-current`.
 */
export function ActivityChannelFilter({
  label,
  items,
  className = "",
}: {
  label: string;
  items: ChannelFilterItem[];
  className?: string;
}) {
  return (
    // The 1px gap over an ink background draws the hairlines between cells.
    <nav
      aria-label={label}
      className={`grid gap-px overflow-hidden rounded-panel border border-ink bg-ink grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 ${className}`}
    >
      {items.map((item, index) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.current ? "page" : undefined}
          // The leading total spans two cells below `lg` so the odd number of
          // channels still fills the grid instead of leaving a blank box.
          className={`flex min-h-11 items-baseline justify-between gap-2 px-3 py-2.5 transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:-outline-offset-2 ${
            index === 0 ? "col-span-2 lg:col-span-1" : ""
          } ${
            item.current
              ? "bg-ink text-parchment focus-visible:outline-parchment"
              : "bg-white text-ink hover:bg-hover focus-visible:outline-ink"
          }`}
        >
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.12em]">
            {item.label}
          </span>
          <span className="font-sans text-sm font-semibold tabular-nums">
            {item.count}
          </span>
        </Link>
      ))}
    </nav>
  );
}

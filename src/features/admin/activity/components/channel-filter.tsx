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
 * Compact metric strip: one hairline cell per channel. The count is the
 * answer; tapping it is the filter. Four columns on a phone so two rows
 * clear the fold, seven on a wide pane so the strip is one scan line.
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
      className={`grid grid-cols-4 gap-px overflow-hidden rounded-panel border border-ink bg-ink lg:grid-cols-7 ${className}`}
    >
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          title={`${item.label} ${item.count}`}
          aria-current={item.current ? "page" : undefined}
          // The leading total spans two cells below `lg` so seven channels
          // fill two rows instead of leaving a black empty box.
          className={`flex min-h-11 min-w-0 flex-col justify-center gap-0.5 px-2 py-1.5 transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:-outline-offset-2 sm:px-3 ${
            item.key === "all" ? "col-span-2 lg:col-span-1" : ""
          } ${
            item.current
              ? "bg-ink text-parchment focus-visible:outline-parchment"
              : "bg-white text-ink hover:bg-hover focus-visible:outline-ink"
          }`}
        >
          <span className="truncate text-[0.6rem] font-bold uppercase tracking-[0.12em] sm:text-[0.65rem]">
            {item.label}
          </span>
          <span className="font-sans text-sm font-semibold tabular-nums leading-none">
            {item.count}
          </span>
        </Link>
      ))}
    </nav>
  );
}

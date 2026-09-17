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
 * answer; tapping it is the filter. Below `lg` the seven cells scroll
 * sideways inside the panel so labels stay whole; from `lg` they share one
 * scan line.
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
    <nav
      aria-label={label}
      className={`snap-x snap-proximity overflow-x-auto overscroll-x-contain rounded-panel border border-ink ${className}`}
    >
      {/* The 1px gap over an ink background draws the hairlines between cells. */}
      <div className="grid min-w-[58rem] grid-cols-7 gap-px bg-ink lg:min-w-full">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            title={`${item.label} ${item.count}`}
            aria-current={item.current ? "page" : undefined}
            className={`flex min-h-11 min-w-0 snap-start flex-col justify-center gap-0.5 px-2.5 py-1.5 transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:-outline-offset-2 sm:px-3 ${
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
      </div>
    </nav>
  );
}

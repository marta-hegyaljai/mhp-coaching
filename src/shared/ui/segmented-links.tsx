import type {PathnameHref} from "@/i18n/href";
import {Link} from "@/i18n/navigation";

export type SegmentedItem = {
  key: string;
  href: PathnameHref;
  label: string;
  current: boolean;
};

/**
 * One bordered group of mutually exclusive views. Selection reads from the
 * inverted surface and `aria-current`, never from colour alone.
 */
export function SegmentedLinks({
  label,
  items,
  className = "",
}: {
  label: string;
  items: SegmentedItem[];
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex rounded-panel border border-ink ${className}`}
    >
      {items.map((item, index) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.current ? "page" : undefined}
          className={`inline-flex min-h-11 items-center px-4 text-xs font-semibold uppercase tracking-[0.1em] transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
            index > 0 ? "border-l border-ink" : ""
          } ${item.current ? "bg-ink text-parchment" : "bg-white text-ink hover:bg-hover"}`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

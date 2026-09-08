import type {ReactNode} from "react";

type PriceSize = "sm" | "md" | "lg";

const sizes: Record<PriceSize, string> = {
  sm: "text-sm font-semibold",
  md: "text-xl font-semibold tracking-tight",
  lg: "text-[1.75rem] font-semibold tracking-tight sm:text-[2rem]",
};

/**
 * Course amounts are commercial figures, not editorial headings.
 * Source Sans keeps them readable and aligned like ordinary product prices.
 */
export function Price({
  children,
  size = "md",
  className = "",
}: {
  children: ReactNode;
  size?: PriceSize;
  className?: string;
}) {
  return (
    <span
      className={`inline-block font-sans tabular-nums leading-none text-ink ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}

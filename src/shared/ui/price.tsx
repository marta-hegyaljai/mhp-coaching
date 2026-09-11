import type {ReactNode} from "react";

type PriceSize = "sm" | "md" | "lg";
type PriceTone = "strong" | "muted";

const sizes: Record<PriceSize, string> = {
  sm: "text-sm font-semibold",
  md: "text-xl font-semibold tracking-tight",
  lg: "text-[1.75rem] font-semibold tracking-tight sm:text-[2rem]",
};

// A non-chargeable amount stays a price so figures keep aligning down a list;
// only its contrast drops.
const tones: Record<PriceTone, string> = {
  strong: "text-ink",
  muted: "text-ink-subtle",
};

/**
 * Course amounts are commercial figures, not editorial headings.
 * Source Sans keeps them readable and aligned like ordinary product prices.
 */
export function Price({
  children,
  size = "md",
  tone = "strong",
  className = "",
}: {
  children: ReactNode;
  size?: PriceSize;
  tone?: PriceTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-block font-sans tabular-nums leading-none ${sizes[size]} ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

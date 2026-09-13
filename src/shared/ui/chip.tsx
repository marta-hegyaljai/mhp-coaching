import type {ReactNode} from "react";

export type ChipTone = "outline" | "strong";

// Chips stay monochrome and textual: they qualify a row, never colour it.
const tones: Record<ChipTone, string> = {
  outline: "border border-ink text-ink",
  strong: "bg-ink text-parchment",
};

/** Small rectangular qualifier sitting next to a title or a date. */
export function Chip({
  children,
  tone = "outline",
  className = "",
}: {
  children: ReactNode;
  tone?: ChipTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-panel px-1.5 py-px text-[0.65rem] font-bold uppercase tracking-[0.12em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

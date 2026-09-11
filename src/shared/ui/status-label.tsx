import type {ReactNode} from "react";

export type StatusTone = "strong" | "muted";

// Status stays monochrome and textual: gold is reserved for editorial eyebrows
// and primary-CTA hover, never for semantic success/warning states.
const tones: Record<StatusTone, string> = {
  strong: "text-ink",
  muted: "text-ink-subtle",
};

export function StatusLabel({
  children,
  tone = "strong",
  className = "",
}: {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <p
      className={`text-[0.7rem] font-bold uppercase tracking-[0.2em] ${tones[tone]} ${className}`}
    >
      {children}
    </p>
  );
}

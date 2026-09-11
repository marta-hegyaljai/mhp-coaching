import type {ReactNode} from "react";

/**
 * Small uppercase label above a panel or control group. Rendered as a
 * paragraph because the global stylesheet forces headings into the editorial
 * serif, which would fight this functional micro-type.
 */
export function SectionLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-[0.7rem] font-bold uppercase tracking-[0.2em] text-ink-subtle ${className}`}
    >
      {children}
    </p>
  );
}

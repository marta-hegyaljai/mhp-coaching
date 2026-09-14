import type {ReactNode} from "react";

/**
 * One hairline control surface that sits directly above the list it drives, so
 * view, filter and presentation controls read as one thing instead of floating
 * on the page.
 */
export function Toolbar({children, className = ""}: {children: ReactNode; className?: string}) {
  return <div className={`rounded-panel border border-ink bg-white ${className}`}>{children}</div>;
}

/** One row inside a `<Toolbar>`; `divided` draws the hairline above it. */
export function ToolbarRow({
  children,
  divided = false,
  className = "",
}: {
  children: ReactNode;
  divided?: boolean;
  className?: string;
}) {
  return (
    <div className={`px-4 py-3 ${divided ? "border-t border-line" : ""} ${className}`}>
      {children}
    </div>
  );
}

/** The horizontal control group used inside a toolbar row. */
export const toolbarGroupClass = "flex flex-wrap items-center gap-x-5 gap-y-3";

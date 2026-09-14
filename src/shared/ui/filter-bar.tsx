import type {ReactNode} from "react";

export type FilterBarFrame = "panel" | "inline";

// `panel` is the standalone bordered bar; `inline` drops the frame so the bar
// can be one row of a larger control surface that already owns the hairlines.
const frames: Record<FilterBarFrame, string> = {
  panel: "rounded-panel border border-ink bg-white p-4",
  inline: "",
};

/**
 * The bordered `GET` bar that narrows an operational list. Filtering stays a
 * plain form submit so every list state has a shareable URL.
 */
export function FilterBar({
  action,
  label,
  columnsClassName,
  frame = "panel",
  children,
  actions,
}: {
  action: string;
  /** Names the landmark; the inner labels name each control. */
  label: string;
  columnsClassName: string;
  frame?: FilterBarFrame;
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <form
      method="get"
      action={action}
      aria-label={label}
      className={`grid gap-3 sm:items-end ${frames[frame]} ${columnsClassName}`}
    >
      {children}
      <div className="flex min-h-11 flex-wrap items-center gap-4 sm:justify-end">{actions}</div>
    </form>
  );
}

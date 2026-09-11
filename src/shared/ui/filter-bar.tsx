import type {ReactNode} from "react";

/**
 * The bordered `GET` bar that narrows an operational list. Filtering stays a
 * plain form submit so every list state has a shareable URL.
 */
export function FilterBar({
  action,
  label,
  columnsClassName,
  children,
  actions,
}: {
  action: string;
  /** Names the landmark; the inner labels name each control. */
  label: string;
  columnsClassName: string;
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <form
      method="get"
      action={action}
      aria-label={label}
      className={`grid gap-3 rounded-panel border border-ink bg-white p-4 sm:items-end ${columnsClassName}`}
    >
      {children}
      <div className="flex min-h-11 flex-wrap items-center gap-4 sm:justify-end">{actions}</div>
    </form>
  );
}

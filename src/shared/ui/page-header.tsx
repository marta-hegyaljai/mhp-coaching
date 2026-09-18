import type {ReactNode} from "react";

export const pageTitleClass = "font-serif text-subheading";

/**
 * Title, one line of orientation and the single primary action of a working
 * screen on one compact band, so the records below stay near the fold.
 * Public catalogue pages keep the heading/title/display scale instead.
 */
export function PageHeader({
  title,
  intro,
  action,
  className = "",
}: {
  title: string;
  intro?: ReactNode;
  /** The one primary action of the screen; it sits on the title line. */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6 ${className}`}
    >
      <div className="min-w-0">
        <h1 className={pageTitleClass}>{title}</h1>
        {intro ? (
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-ink-muted">{intro}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

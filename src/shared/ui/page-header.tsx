import type {ReactNode} from "react";

/**
 * Title, one line of orientation and the single primary action of a working
 * screen on one band, so the records below stay near the top of the viewport.
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
      className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8 ${className}`}
    >
      <div className="min-w-0">
        <h1 className="font-serif text-heading">{title}</h1>
        {intro ? <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">{intro}</p> : null}
      </div>
      {action ? <div className="shrink-0 sm:mt-1">{action}</div> : null}
    </div>
  );
}

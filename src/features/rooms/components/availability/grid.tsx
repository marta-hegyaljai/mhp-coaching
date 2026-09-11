import type {ReactNode} from "react";

import {Link} from "@/i18n/navigation";
import {ArrowRightIcon} from "@/shared/ui/icons";

import {mergeSlotRuns, type RunCell} from "./runs";
import {slotMetaText, slotSurface, type SlotLabels} from "./slot-styles";

export type GridColumn = {
  key: string;
  heading: ReactNode;
  current?: boolean;
  cells: RunCell[];
};

/**
 * A time grid whose rows stay aligned across columns while consecutive slots
 * of the same state render as a single spanning bar.
 */
export function AvailabilityGrid({
  caption,
  times,
  columns,
  labels,
  minWidthClass = "min-w-[22rem]",
}: {
  caption: string;
  times: string[];
  columns: GridColumn[];
  labels: SlotLabels;
  minWidthClass?: string;
}) {
  const plans = columns.map((column) => {
    const runs = mergeSlotRuns(column.cells);
    const covered = new Set<number>();

    for (const run of runs) {
      for (let offset = 1; offset < run.span; offset += 1) {
        covered.add(run.startIndex + offset);
      }
    }

    return {
      byStart: new Map(runs.map((run) => [run.startIndex, run])),
      covered,
    };
  });

  return (
    <div className="overflow-x-auto">
      <table
        className={`w-full border-separate border-spacing-[3px] text-left ${minWidthClass}`}
      >
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="w-14 p-0">
              <span className="sr-only">{caption}</span>
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-current={column.current ? "date" : undefined}
                className={`border-b px-2 pb-2 align-bottom text-xs font-semibold ${
                  column.current ? "border-ink text-ink" : "border-line text-ink-muted"
                }`}
              >
                {column.heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {times.map((time, rowIndex) => (
            <tr key={time}>
              <th
                scope="row"
                className={`h-11 whitespace-nowrap pr-2 text-right align-middle font-sans text-[0.7rem] leading-none tabular-nums ${
                  time.endsWith(":00")
                    ? "font-semibold text-ink"
                    : "font-normal text-ink-subtle"
                }`}
              >
                {time}
              </th>
              {columns.map((column, columnIndex) => {
                const run = plans[columnIndex].byStart.get(rowIndex);

                if (!run) {
                  return plans[columnIndex].covered.has(rowIndex) ? null : (
                    <td key={column.key} className="h-11 border border-line bg-shell" />
                  );
                }

                const body = (
                  <>
                    <span className="flex items-center justify-between gap-1 text-[0.62rem] font-semibold uppercase tracking-[0.08em] leading-tight">
                      <span>{labels[run.state]}</span>
                      {run.href ? <ArrowRightIcon className="h-3 w-3" /> : null}
                    </span>
                    {run.meta || run.span > 1 ? (
                      <span
                        className={`mt-0.5 block font-sans text-[0.62rem] leading-tight tabular-nums ${slotMetaText[run.state]}`}
                      >
                        {run.meta ?? `${run.startTime}–${run.endTime}`}
                      </span>
                    ) : null}
                  </>
                );

                return (
                  <td
                    key={column.key}
                    rowSpan={run.span}
                    className={`border px-2 py-1 align-top ${slotSurface[run.state]} ${
                      run.href ? "p-0" : ""
                    }`}
                  >
                    {run.href ? (
                      <Link
                        href={run.href}
                        className={`block h-full min-h-11 cursor-pointer px-2 py-1 transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ink ${
                          run.state === "my-booking"
                            ? "hover:bg-white hover:text-ink"
                            : "hover:bg-ink hover:text-parchment"
                        }`}
                        aria-label={
                          run.ariaLabel ??
                          `${labels[run.state]} ${run.startTime}–${run.endTime}`
                        }
                      >
                        {body}
                      </Link>
                    ) : (
                      body
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

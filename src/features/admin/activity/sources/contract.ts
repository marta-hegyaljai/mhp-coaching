import type {AppLocale} from "@/i18n/routing";

import type {ActivityCopy} from "../labels";
import type {ActivityEntry, ActivityKind} from "../types";
import type {ActivityBounds} from "../window";

export type ActivitySourceInput = {
  bounds: ActivityBounds;
  /** Already trimmed and length-capped by `parseActivityQuery`. */
  q: string;
  /**
   * How many of this channel's best-ordered rows the merge may need. `0` means
   * the panel only wants the count, so the row query is skipped entirely.
   */
  limit: number;
  locale: AppLocale;
  copy: ActivityCopy;
};

export type ActivitySourceResult = {
  entries: ActivityEntry[];
  total: number;
};

export type ActivityChannel = {
  kind: ActivityKind;
  load: (input: ActivitySourceInput) => Promise<ActivitySourceResult>;
};

export const EMPTY_RESULT: ActivitySourceResult = {entries: [], total: 0};

/**
 * Counts always run; rows only when the panel is actually rendering this
 * channel. Keeping both in one place stops a source from forgetting either.
 */
export async function countAndList<TRow>(input: {
  limit: number;
  count: () => Promise<number>;
  rows: (limit: number) => Promise<TRow[]>;
}): Promise<{total: number; rows: TRow[]}> {
  const [total, rows] = await Promise.all([
    input.count(),
    input.limit > 0 ? input.rows(input.limit) : Promise.resolve<TRow[]>([]),
  ]);

  return {total, rows};
}

/** Postgres `ILIKE` needles must not let a pasted `%` widen the search. */
export function likeNeedle(value: string): string {
  const escaped = value
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");

  return `%${escaped}%`;
}

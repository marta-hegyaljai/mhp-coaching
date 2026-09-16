import type {ActivitySourceResult} from "./sources/contract";
import {
  ACTIVITY_KINDS,
  type ActivityKind,
  type ActivityKindCounts,
  type ActivityPage,
  type ActivityWindow,
} from "./types";
import {compareActivityEntries} from "./window";

export type ChannelResult = {
  kind: ActivityKind;
  result: ActivitySourceResult;
};

function emptyCounts(): ActivityKindCounts {
  return Object.fromEntries(
    ACTIVITY_KINDS.map((kind) => [kind, 0]),
  ) as ActivityKindCounts;
}

/**
 * Turns per-channel reads into one ordered page.
 *
 * Every selected channel is read `page * pageSize` deep, so the globally first
 * `page * pageSize` rows are guaranteed to be inside the union: no channel can
 * contribute more than that many rows to it. That is what makes slicing the
 * merged array a correct global page rather than an approximation.
 */
export function mergeActivityPage(input: {
  results: ChannelResult[];
  /** Which channels the panel is showing; the rest only contribute counts. */
  isSelected: (kind: ActivityKind) => boolean;
  when: ActivityWindow;
  page: number;
  pageSize: number;
  /** Deepest page the channels were read for; pages beyond it are unreachable. */
  maxPage: number;
}): {page: ActivityPage; counts: ActivityKindCounts; windowTotal: number} {
  const pageSize = Math.max(1, input.pageSize);
  const counts = emptyCounts();
  let total = 0;
  let windowTotal = 0;

  for (const {kind, result} of input.results) {
    counts[kind] = result.total;
    windowTotal += result.total;
    if (input.isSelected(kind)) {
      total += result.total;
    }
  }

  const merged = input.results
    .filter(({kind}) => input.isSelected(kind))
    .flatMap(({result}) => result.entries)
    .sort(compareActivityEntries(input.when));

  // Never advertise a page the reader cannot actually reach: past the read
  // depth the merge has no rows to order, so paging there is a dead end.
  const pageCount = Math.min(
    Math.max(1, input.maxPage),
    Math.max(1, Math.ceil(total / pageSize)),
  );
  // A stale deep link lands on the last real page, never on an empty list.
  const page = Math.min(Math.max(1, input.page), pageCount);
  const offset = (page - 1) * pageSize;

  return {
    page: {
      entries: merged.slice(offset, offset + pageSize),
      total,
      page,
      pageCount,
      pageSize,
    },
    counts,
    windowTotal,
  };
}

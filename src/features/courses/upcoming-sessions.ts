export const UPCOMING_SESSION_PREVIEW_COUNT = 3;

export function partitionUpcomingSessions<T>(
  dates: readonly T[],
  previewCount = UPCOMING_SESSION_PREVIEW_COUNT,
): {preview: T[]; extra: T[]} {
  const limit = Math.max(0, previewCount);

  return {
    preview: dates.slice(0, limit),
    extra: dates.slice(limit),
  };
}

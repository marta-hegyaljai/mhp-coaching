import {activityQueryParams, type ActivityQuery} from "../query";

/**
 * Hidden GET fields that keep the rest of the board when one pane submits.
 * Defaults are omitted, so an empty search stays a clean path.
 */
export function ActivityQueryFields({
  query,
  omit = [],
}: {
  query: ActivityQuery;
  omit?: string[];
}) {
  return (
    <>
      {Object.entries(activityQueryParams(query))
        .filter(([key, value]) => value && !omit.includes(key))
        .map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
    </>
  );
}

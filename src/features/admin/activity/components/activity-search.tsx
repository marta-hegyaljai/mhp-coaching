import {Link} from "@/i18n/navigation";
import {Button} from "@/shared/ui/button";
import {InputField} from "@/shared/ui/field";

import {activityHref, type ActivityQuery} from "../query";
import {ActivityQueryFields} from "./activity-query-fields";

export type ActivitySearchLabels = {
  filter: string;
  search: string;
  searchPlaceholder: string;
  clear: string;
};

/** One field that searches every pane. The board itself is the rest of the UI. */
export function ActivitySearch({
  action,
  query,
  labels,
  className = "",
}: {
  action: string;
  query: ActivityQuery;
  labels: ActivitySearchLabels;
  className?: string;
}) {
  const filtered = query.q !== "" || query.kind !== "all";

  return (
    <form
      method="get"
      action={action}
      aria-label={labels.filter}
      className={`flex min-w-0 flex-nowrap items-center gap-2 ${className}`}
    >
      <input type="hidden" name="kind" value={query.kind} />
      <ActivityQueryFields query={query} omit={["kind", "q"]} />
      <InputField
        id="activity-q"
        name="q"
        type="search"
        label={labels.search}
        labelHidden
        defaultValue={query.q}
        placeholder={labels.searchPlaceholder}
        size="sm"
        autoComplete="off"
        fieldClassName="min-w-0 flex-1"
      />
      <Button type="submit" variant="secondary" className="shrink-0">
        {labels.filter}
      </Button>
      {filtered ? (
        <Link
          href={activityHref({
            window: query.window,
            day: query.day,
            showUpcomingCancelled: query.showUpcomingCancelled,
            showHistoryCancelled: query.showHistoryCancelled,
          })}
          className="inline-flex min-h-11 shrink-0 items-center text-sm underline-offset-4 hover:underline"
        >
          {labels.clear}
        </Link>
      ) : null}
    </form>
  );
}

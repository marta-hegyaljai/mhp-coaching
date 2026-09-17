import {Link} from "@/i18n/navigation";
import {Button} from "@/shared/ui/button";
import {InputField} from "@/shared/ui/field";
import {FilterBar} from "@/shared/ui/filter-bar";
import {SegmentedLinks} from "@/shared/ui/segmented-links";
import {Toolbar, ToolbarRow, toolbarGroupClass} from "@/shared/ui/toolbar";

import {activityFilterHref, activityHref, type ActivityQuery} from "../query";
import {ACTIVITY_WINDOWS} from "../types";

export type ActivityToolbarLabels = {
  windowGroup: string;
  windows: Record<(typeof ACTIVITY_WINDOWS)[number], string>;
  filter: string;
  search: string;
  searchPlaceholder: string;
  clear: string;
};

/**
 * Period, search, reset and the visible count share one hairline surface so
 * the list itself stays the first thing a reader sees.
 */
export function ActivityToolbar({
  action,
  query,
  count,
  labels,
}: {
  /** Localized path of the panel itself; the search form posts back to it. */
  action: string;
  query: ActivityQuery;
  /** Null when the window is empty, so the toolbar does not invent a range. */
  count: string | null;
  labels: ActivityToolbarLabels;
}) {
  const filtered = query.q !== "" || query.kind !== "all";

  return (
    <Toolbar>
      <div className="lg:flex lg:items-stretch">
        <ToolbarRow className={`${toolbarGroupClass} lg:shrink-0`}>
          <SegmentedLinks
            fill
            label={labels.windowGroup}
            items={ACTIVITY_WINDOWS.map((when) => ({
              key: when,
              href: activityFilterHref(query, {when}),
              label: labels.windows[when],
              current: query.when === when,
            }))}
          />
        </ToolbarRow>
        <ToolbarRow
          divided
          className="lg:min-w-0 lg:flex-1 lg:border-t-0 lg:border-l"
        >
          <FilterBar
            action={action}
            label={labels.filter}
            frame="inline"
            columnsClassName="grid-cols-[minmax(0,1fr)_auto]"
            actions={
              <>
                <Button type="submit" variant="secondary">
                  {labels.filter}
                </Button>
                {filtered ? (
                  <Link
                    href={activityHref({when: query.when})}
                    className="inline-flex min-h-11 items-center text-sm underline-offset-4 hover:underline"
                  >
                    {labels.clear}
                  </Link>
                ) : null}
                {count ? (
                  <p className="font-sans text-sm tabular-nums text-ink-muted">{count}</p>
                ) : null}
              </>
            }
          >
            {/* The window and channel survive a search submit. */}
            <input type="hidden" name="when" value={query.when} />
            <input type="hidden" name="kind" value={query.kind} />
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
            />
          </FilterBar>
        </ToolbarRow>
      </div>
    </Toolbar>
  );
}

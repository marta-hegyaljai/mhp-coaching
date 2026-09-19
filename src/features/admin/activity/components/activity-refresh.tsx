"use client";

import {useTransition} from "react";

import {useRouter} from "@/i18n/navigation";
import {RefreshIcon, SpinnerIcon} from "@/shared/ui/icons";

export type ActivityRefreshLabels = {
  refresh: string;
  refreshing: string;
};

/**
 * Reloads every activity pane without changing the query. A 44px square below
 * `lg` keeps the search row one line; from `lg` the same secondary control
 * shows its label. Padding is owned here so it does not fight `Button`'s `px-5`.
 */
export function ActivityRefresh({labels}: {labels: ActivityRefreshLabels}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const name = pending ? labels.refreshing : labels.refresh;

  return (
    <button
      type="button"
      aria-busy={pending}
      disabled={pending}
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-panel border border-ink bg-shell text-sm font-semibold tracking-[0.02em] text-ink transition-[background-color,color,border-color,transform] duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 lg:w-auto lg:px-5"
    >
      {pending ? <SpinnerIcon /> : <RefreshIcon />}
      <span className="sr-only lg:not-sr-only">{name}</span>
    </button>
  );
}

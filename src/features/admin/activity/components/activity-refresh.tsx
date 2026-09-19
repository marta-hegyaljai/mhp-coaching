"use client";

import {useTransition} from "react";

import {useRouter} from "@/i18n/navigation";
import {Button} from "@/shared/ui/button";
import {RefreshIcon, SpinnerIcon} from "@/shared/ui/icons";

export type ActivityRefreshLabels = {
  refresh: string;
  refreshing: string;
};

/**
 * Reloads every activity pane without changing the query. Icon-only below `lg`
 * so the search row stays one 44px line; labelled from `lg` where there is
 * room.
 */
export function ActivityRefresh({labels}: {labels: ActivityRefreshLabels}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const name = pending ? labels.refreshing : labels.refresh;

  return (
    <Button
      type="button"
      variant="secondary"
      aria-busy={pending}
      disabled={pending}
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
      className="min-w-11 shrink-0 px-0 lg:px-5"
    >
      {pending ? <SpinnerIcon /> : <RefreshIcon />}
      <span className="sr-only lg:not-sr-only">{name}</span>
    </Button>
  );
}

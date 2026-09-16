import type {AppLocale} from "@/i18n/routing";

import type {ActivityCopy} from "./labels";
import {mergeActivityPage} from "./paginate";
import {
  ACTIVITY_MAX_PAGE,
  ACTIVITY_PAGE_SIZE,
  type ActivityQuery,
} from "./query";
import {callChannel} from "./sources/calls";
import {changeChannel} from "./sources/changes";
import type {ActivityChannel} from "./sources/contract";
import {messageChannel} from "./sources/messages";
import {registrationChannel} from "./sources/registrations";
import {reservationChannel} from "./sources/reservations";
import {waitlistChannel} from "./sources/waitlist";
import type {ActivityKind, ActivityKindCounts, ActivityPage} from "./types";
import {activityBounds, type ActivityBounds} from "./window";

const defaultChannels: ActivityChannel[] = [
  registrationChannel,
  reservationChannel,
  callChannel,
  messageChannel,
  waitlistChannel,
  changeChannel,
];

export type ActivityFeed = {
  page: ActivityPage;
  /** Totals for every channel in this window, so the filter can show counts. */
  counts: ActivityKindCounts;
  /** Rows across every channel in this window, regardless of the filter. */
  windowTotal: number;
  bounds: ActivityBounds;
};

/**
 * Reads every channel for the selected window and returns one merged page.
 * Counts always cover all channels, so the filter stays informative even while
 * a single channel is selected.
 */
export async function loadActivityFeed(input: {
  query: ActivityQuery;
  locale: AppLocale;
  copy: ActivityCopy;
  now?: Date;
  pageSize?: number;
  channels?: ActivityChannel[];
}): Promise<ActivityFeed> {
  const pageSize = Math.max(1, input.pageSize ?? ACTIVITY_PAGE_SIZE);
  const bounds = activityBounds(input.query.when, input.now);
  const channels = input.channels ?? defaultChannels;
  const isSelected = (kind: ActivityKind) =>
    input.query.kind === "all" || input.query.kind === kind;

  const results = await Promise.all(
    channels.map(async (channel) => ({
      kind: channel.kind,
      result: await channel.load({
        bounds,
        q: input.query.q,
        // Unselected channels answer with a count only.
        limit: isSelected(channel.kind) ? input.query.page * pageSize : 0,
        locale: input.locale,
        copy: input.copy,
      }),
    })),
  );

  const merged = mergeActivityPage({
    results,
    isSelected,
    when: input.query.when,
    page: input.query.page,
    pageSize,
    maxPage: ACTIVITY_MAX_PAGE,
  });

  return {...merged, bounds};
}

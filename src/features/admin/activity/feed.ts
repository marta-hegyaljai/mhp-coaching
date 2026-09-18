import type {AppLocale} from "@/i18n/routing";

import {isListedActivityKind} from "./listed";
import type {ActivityCopy} from "./labels";
import {mergeActivityPage} from "./paginate";
import {
  ACTIVITY_BOARD_SIZE,
  ACTIVITY_MAX_PAGE,
  type ActivityQuery,
} from "./query";
import {callChannel} from "./sources/calls";
import {changeChannel} from "./sources/changes";
import type {ActivityChannel} from "./sources/contract";
import {messageChannel} from "./sources/messages";
import {registrationChannel} from "./sources/registrations";
import {reservationChannel} from "./sources/reservations";
import {waitlistChannel} from "./sources/waitlist";
import type {ActivityKind, ActivityKindCounts, ActivityPage, ActivityWindow} from "./types";
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
  counts: ActivityKindCounts;
  windowTotal: number;
  bounds: ActivityBounds;
};

export type ActivityBriefing = {
  today: ActivityFeed;
  upcoming: ActivityFeed;
  history: ActivityFeed;
};

/**
 * Reads every channel for one window and returns one merged page. Counts
 * always cover all channels, so a column can show the live total and the log
 * even while only live rows are listed.
 */
export async function loadActivityFeed(input: {
  query: ActivityQuery;
  when: ActivityWindow;
  locale: AppLocale;
  copy: ActivityCopy;
  now?: Date;
  page?: number;
  pageSize?: number;
  channels?: ActivityChannel[];
}): Promise<ActivityFeed> {
  const pageSize = Math.max(1, input.pageSize ?? ACTIVITY_BOARD_SIZE);
  const page = input.page ?? 1;
  const bounds = activityBounds(input.when, input.now);
  const channels = input.channels ?? defaultChannels;
  const isSelected = (kind: ActivityKind) =>
    isListedActivityKind(input.query.kind, kind);

  const results = await Promise.all(
    channels.map(async (channel) => ({
      kind: channel.kind,
      result: await channel.load({
        bounds,
        q: input.query.q,
        limit: isSelected(channel.kind) ? page * pageSize : 0,
        locale: input.locale,
        copy: input.copy,
      }),
    })),
  );

  const merged = mergeActivityPage({
    results,
    isSelected,
    when: input.when,
    page,
    pageSize,
    maxPage: ACTIVITY_MAX_PAGE,
  });

  return {...merged, bounds};
}

/**
 * The control panel is three windows at once. Each is an independent read so
 * Today, Upcoming and History can fill the same viewport.
 */
export async function loadActivityBriefing(input: {
  query: ActivityQuery;
  locale: AppLocale;
  copy: ActivityCopy;
  now?: Date;
  channels?: ActivityChannel[];
}): Promise<ActivityBriefing> {
  const shared = {
    query: input.query,
    locale: input.locale,
    copy: input.copy,
    now: input.now,
    channels: input.channels,
    pageSize: ACTIVITY_BOARD_SIZE,
  };

  const [today, upcoming, history] = await Promise.all([
    loadActivityFeed({...shared, when: "today", page: 1}),
    loadActivityFeed({...shared, when: "upcoming", page: 1}),
    loadActivityFeed({
      ...shared,
      when: "history",
      page: input.query.historyPage,
    }),
  ]);

  return {today, upcoming, history};
}

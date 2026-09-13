"use client";

import {useMemo, useState, type ReactNode} from "react";
import {useTranslations} from "next-intl";

import {
  courseDetailHref,
  type CourseSessionShow,
} from "@/features/courses/admin-query";
import type {Course} from "@/features/courses/types";
import type {AppLocale} from "@/i18n/routing";
import {Button} from "@/shared/ui/button";
import {ChevronDownIcon} from "@/shared/ui/icons";
import {MetricStrip, type Metric} from "@/shared/ui/metric-strip";
import {SectionLabel} from "@/shared/ui/section-label";

import {CreateSessionPanel} from "./create-session-panel";
import {
  buildSessionEntries,
  countSessionEntries,
  filterSessionGroups,
  summarizeSessions,
  type SessionEntry,
} from "./model";
import {SessionRow} from "./session-row";

const CREATE_PANEL_ID = "course-session-create";

/**
 * The single sessions list: a dense calendar of every date, with exactly one
 * row expanded for editing at a time. Past dates stay folded so the upcoming
 * schedule is the first screen.
 */
export function AdminSessionList({
  course,
  enrolmentCounts,
  today,
  locale,
  show,
}: {
  course: Course;
  /** Paid and pending enrolments per session id. */
  enrolmentCounts: Readonly<Record<string, number>>;
  /** Zurich-local day, resolved on the server so both renders agree. */
  today: string;
  locale: AppLocale;
  show: CourseSessionShow;
}) {
  const t = useTranslations("Admin");
  const groups = useMemo(
    () => buildSessionEntries(course.dates, enrolmentCounts, today),
    [course.dates, enrolmentCounts, today],
  );
  const visible = useMemo(() => filterSessionGroups(groups, show), [groups, show]);
  const summary = useMemo(() => summarizeSessions(groups), [groups]);
  const visibleCount = countSessionEntries(visible);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(summary.total === 0);

  const metrics: Metric[] = [
    {
      key: "upcoming",
      label: t("coursesSessionsMetricUpcoming"),
      value: summary.upcoming,
      href:
        summary.upcoming > 0
          ? courseDetailHref(course.id, {tab: "sessions", show: "upcoming"})
          : undefined,
    },
    {
      key: "inactive",
      label: t("coursesSessionsMetricInactive"),
      value: summary.inactive,
      href:
        summary.inactive > 0
          ? courseDetailHref(course.id, {tab: "sessions", show: "inactive"})
          : undefined,
    },
    {
      key: "past",
      label: t("coursesSessionsMetricPast"),
      value: summary.past,
      href:
        summary.past > 0
          ? courseDetailHref(course.id, {tab: "sessions", show: "past"})
          : undefined,
    },
  ];

  const openRow = (id: string | null) => {
    setCreating(false);
    setOpenId(id);
  };

  const renderRow = (entry: SessionEntry) => (
    <SessionRow
      key={entry.date.id}
      courseId={course.id}
      entry={entry}
      locale={locale}
      open={openId === entry.date.id}
      onToggle={(next) => openRow(next ? entry.date.id : null)}
    />
  );

  return (
    <section className="space-y-4">
      <h2 className="sr-only">{t("coursesSessionsTitle")}</h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <MetricStrip metrics={metrics} density="trio" className="sm:min-w-0 sm:flex-1" />
        <Button
          type="button"
          variant="secondary"
          aria-expanded={creating}
          aria-controls={CREATE_PANEL_ID}
          className="sm:self-stretch sm:px-4"
          onClick={() => {
            setOpenId(null);
            setCreating((open) => !open);
          }}
        >
          {t("coursesAddSession")}
        </Button>
      </div>

      {show !== "all" ? (
        <p className="font-sans text-sm tabular-nums text-ink">
          {t("coursesSessionResultCount", {shown: visibleCount, total: summary.total})}
        </p>
      ) : null}

      {creating ? (
        <CreateSessionPanel
          id={CREATE_PANEL_ID}
          course={course}
          locale={locale}
          onClose={() => setCreating(false)}
        />
      ) : null}

      {summary.total === 0 ? (
        <p className="rounded-panel border border-ink bg-white px-5 py-8 text-center text-sm text-ink-muted">
          {t("coursesNoSessions")}
        </p>
      ) : visibleCount === 0 ? (
        <p className="rounded-panel border border-ink bg-white px-5 py-8 text-center text-sm text-ink-muted">
          {t("coursesSessionsFilterEmpty")}
        </p>
      ) : (
        <div className="space-y-5">
          <SessionGroup label={t("coursesSessionsUpcoming")} entries={visible.upcoming} open>
            {renderRow}
          </SessionGroup>
          <SessionGroup
            key={`past-${show}`}
            label={t("coursesSessionsPast")}
            entries={visible.past}
            open={show === "past" || visible.upcoming.length === 0}
            collapsible={show !== "past"}
          >
            {renderRow}
          </SessionGroup>
        </div>
      )}
    </section>
  );
}

function SessionGroup({
  label,
  entries,
  open,
  collapsible = false,
  children,
}: {
  label: string;
  entries: SessionEntry[];
  open: boolean;
  /** Past dates start folded so the upcoming list is the first screen. */
  collapsible?: boolean;
  children: (entry: SessionEntry) => ReactNode;
}) {
  const [expanded, setExpanded] = useState(open);

  if (entries.length === 0) {
    return null;
  }

  const shown = !collapsible || expanded;

  return (
    <div>
      {collapsible ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={shown}
          className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 text-left transition-colors duration-150 ease-standard hover:text-ink"
        >
          <span className="flex items-baseline gap-3">
            <SectionLabel>{label}</SectionLabel>
            <span className="font-sans text-xs tabular-nums text-ink-subtle">
              {entries.length}
            </span>
          </span>
          <ChevronDownIcon
            className={`text-ink-subtle transition-transform duration-150 ease-standard ${
              shown ? "rotate-180" : ""
            }`}
          />
        </button>
      ) : (
        <div className="flex items-baseline justify-between gap-3">
          <SectionLabel>{label}</SectionLabel>
          <p className="font-sans text-xs tabular-nums text-ink-subtle">{entries.length}</p>
        </div>
      )}
      {shown ? (
        <ul className="mt-2 overflow-hidden rounded-panel border border-ink bg-white">
          {entries.map((entry) => children(entry))}
        </ul>
      ) : null}
    </div>
  );
}

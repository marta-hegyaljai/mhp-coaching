import {courseDetailHref, type CourseRecordTab} from "@/features/courses/admin-query";
import {Link} from "@/i18n/navigation";

export type CourseRecordNavLabels = {
  landmark: string;
  details: string;
  sessions: string;
  enrolments: string;
  waitlist: string;
};

/**
 * Mutually exclusive views of one course record. A 2×2 grid on a phone, one
 * row from `lg`, so the schedule is never buried under the catalogue form.
 */
export function CourseRecordNav({
  courseId,
  current,
  counts,
  labels,
}: {
  courseId: string;
  current: CourseRecordTab;
  counts: {sessions: number; enrolments: number; waitlist: number};
  labels: CourseRecordNavLabels;
}) {
  const items: Array<{
    key: CourseRecordTab;
    label: string;
    count?: number;
    href: ReturnType<typeof courseDetailHref>;
  }> = [
    {
      key: "details",
      label: labels.details,
      href: courseDetailHref(courseId, {tab: "details"}),
    },
    {
      key: "sessions",
      label: labels.sessions,
      count: counts.sessions,
      href: courseDetailHref(courseId, {tab: "sessions"}),
    },
    {
      key: "enrolments",
      label: labels.enrolments,
      count: counts.enrolments,
      href: courseDetailHref(courseId, {tab: "enrolments"}),
    },
    {
      key: "waitlist",
      label: labels.waitlist,
      count: counts.waitlist,
      href: courseDetailHref(courseId, {tab: "waitlist"}),
    },
  ];

  return (
    <nav
      aria-label={labels.landmark}
      className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-ink bg-ink lg:grid-cols-4"
    >
      {items.map((item) => {
        const selected = item.key === current;

        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={selected ? "page" : undefined}
            className={`flex min-h-11 items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold uppercase leading-tight tracking-[0.1em] transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink ${
              selected
                ? "bg-ink text-parchment"
                : "bg-white text-ink hover:bg-hover"
            }`}
          >
            <span className="min-w-0">{item.label}</span>
            {item.count !== undefined ? (
              <span
                className={`font-sans tabular-nums tracking-normal ${
                  !selected && item.key === "waitlist" && item.count > 0
                    ? "text-gold-deep"
                    : ""
                }`}
              >
                {item.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

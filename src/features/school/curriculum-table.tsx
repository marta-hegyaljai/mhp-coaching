import {getTranslations} from "next-intl/server";

import {loadPublishedCourses} from "@/features/courses/live";
import {COURSE_CATEGORIES, type Course, type CourseCategory} from "@/features/courses/types";
import {formatChf} from "@/features/payments/money";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";

/** Reuses the `CoursesPage` labels so the catalogue names never diverge. */
const categoryLabelKeys = {
  foundation: "foundation",
  advanced: "advanced",
  medical: "medical",
  workshop: "workshops",
  supervision: "supervision",
} as const satisfies Record<CourseCategory, string>;

function byDisplayOrder(a: Course, b: Course): number {
  return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
}

/**
 * The curriculum claim on the home page promises a cursus that can be read
 * before enrolling. This renders that cursus straight from the published
 * catalogue, so the page cannot drift from what is actually for sale.
 */
export async function CurriculumTable({
  locale,
  headingId,
  title,
  hoursLabel,
  priceLabel,
}: {
  locale: AppLocale;
  headingId: string;
  title: string;
  hoursLabel: string;
  priceLabel: string;
}) {
  const t = await getTranslations({locale, namespace: "CoursesPage"});
  const published = await loadPublishedCourses();

  const groups = COURSE_CATEGORIES.map((category) => ({
    category,
    label: t(categoryLabelKeys[category]),
    courses: published.filter((course) => course.category === category).sort(byDisplayOrder),
  })).filter((group) => group.courses.length > 0);

  if (groups.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={headingId} className="mt-12">
      <h2 id={headingId} className="font-serif text-heading">
        {title}
      </h2>

      {groups.map((group) => (
        <div key={group.category} className="mt-8">
          <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-ink-subtle">
            {group.label}
          </h3>
          <ul className="mt-3 border-t border-ink">
            {group.courses.map((course) => (
              <li key={course.id} className="border-b border-line">
                <Link
                  href={{pathname: "/courses/[slug]", params: {slug: course.slug[locale]}}}
                  className="group/row flex min-h-11 flex-col gap-1 py-3 transition-colors duration-150 hover:bg-shell sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                >
                  <span className="text-sm font-semibold text-ink underline-offset-4 group-hover/row:underline">
                    {course.title[locale]}
                  </span>
                  {/* Fixed columns so hours and prices stay scannable down
                      the list instead of tracking each title's length. */}
                  <span className="flex shrink-0 gap-4 text-sm text-ink-muted sm:gap-6">
                    <span className="sm:w-44 sm:text-right">
                      <span className="sr-only">{hoursLabel} </span>
                      {course.duration[locale]}
                    </span>
                    <span className="tabular-nums sm:w-24 sm:text-right">
                      <span className="sr-only">{priceLabel} </span>
                      {formatChf(course.priceChf, locale, {compact: true})}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

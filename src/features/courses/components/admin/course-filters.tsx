import {Button} from "@/shared/ui/button";
import {FilterBar} from "@/shared/ui/filter-bar";
import {InputField, SelectField} from "@/shared/ui/field";
import {localizedPath} from "@/features/seo/metadata";
import {
  COURSE_LIST_CATEGORIES,
  COURSE_LIST_PUBLISHED,
  COURSE_LIST_UPCOMING,
  type CourseListQuery,
} from "@/features/courses/admin-query";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";

export function CourseListFilters({
  locale,
  query,
  labels,
}: {
  locale: AppLocale;
  query: CourseListQuery;
  labels: {
    search: string;
    searchPlaceholder: string;
    category: string;
    published: string;
    filter: string;
    clear: string;
    categoryAll: string;
    publishedAll: string;
    publishedYes: string;
    publishedNo: string;
    upcoming: string;
    upcomingAll: string;
    upcomingYes: string;
    upcomingNo: string;
    categories: Record<Exclude<CourseListQuery["category"], "all">, string>;
  };
}) {
  return (
    <FilterBar
      action={localizedPath(locale, "/admin/courses")}
      label={labels.filter}
      columnsClassName="lg:grid-cols-[minmax(0,1fr)_12rem_11rem_11rem_auto]"
      actions={
        <>
          <Button type="submit" variant="secondary">
            {labels.filter}
          </Button>
          <Link href="/admin/courses" className="text-sm underline-offset-4 hover:underline">
            {labels.clear}
          </Link>
        </>
      }
    >
      <InputField
        id="courses-q"
        name="q"
        size="sm"
        label={labels.search}
        defaultValue={query.q}
        placeholder={labels.searchPlaceholder}
      />
      <SelectField
        id="courses-category"
        name="category"
        size="sm"
        label={labels.category}
        defaultValue={query.category}
      >
        {COURSE_LIST_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category === "all" ? labels.categoryAll : labels.categories[category]}
          </option>
        ))}
      </SelectField>
      <SelectField
        id="courses-published"
        name="published"
        size="sm"
        label={labels.published}
        defaultValue={query.published}
      >
        {COURSE_LIST_PUBLISHED.map((value) => (
          <option key={value} value={value}>
            {value === "all"
              ? labels.publishedAll
              : value === "yes"
                ? labels.publishedYes
                : labels.publishedNo}
          </option>
        ))}
      </SelectField>
      <SelectField
        id="courses-upcoming"
        name="upcoming"
        size="sm"
        label={labels.upcoming}
        defaultValue={query.upcoming}
      >
        {COURSE_LIST_UPCOMING.map((value) => (
          <option key={value} value={value}>
            {value === "all"
              ? labels.upcomingAll
              : value === "yes"
                ? labels.upcomingYes
                : labels.upcomingNo}
          </option>
        ))}
      </SelectField>
    </FilterBar>
  );
}

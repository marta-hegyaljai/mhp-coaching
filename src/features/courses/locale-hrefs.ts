import type {Course} from "@/features/courses/types";
import type {PathnameHref} from "@/i18n/href";
import {routing, type AppLocale} from "@/i18n/routing";

export function courseLocaleHrefs(
  pathname: "/courses/[slug]" | "/courses/[slug]/book",
  course: Course,
): Record<AppLocale, PathnameHref> {
  return Object.fromEntries(
    routing.locales.map((locale) => [
      locale,
      {pathname, params: {slug: course.slug[locale]}},
    ]),
  ) as Record<AppLocale, PathnameHref>;
}

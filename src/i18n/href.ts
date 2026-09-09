import type {AppPathname} from "@/i18n/routing";

export type PathnameHref =
  | Exclude<AppPathname, "/courses/[slug]" | "/courses/[slug]/book">
  | {
      pathname: "/courses";
      query?: {view?: string};
    }
  | {
      pathname: "/courses/[slug]";
      params: {slug: string};
    }
  | {
      pathname: "/courses/[slug]/book";
      params: {slug: string};
      query?: {date?: string; waitlist?: string};
    };

export const catalogueCalendarHref = {
  pathname: "/courses",
  query: {view: "calendar"},
} as const satisfies PathnameHref;

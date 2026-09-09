import type {AppPathname} from "@/i18n/routing";

export type PathnameHref =
  | Exclude<AppPathname, "/courses/[slug]" | "/courses/[slug]/book">
  | {
      pathname: "/courses/[slug]";
      params: {slug: string};
    }
  | {
      pathname: "/courses/[slug]/book";
      params: {slug: string};
      query?: {date?: string};
    };

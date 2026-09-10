import type {AppPathname} from "@/i18n/routing";

export type PathnameHref =
  | Exclude<
      AppPathname,
      | "/courses/[slug]"
      | "/courses/[slug]/book"
      | "/invite/[token]"
      | "/reset-password/[token]"
      | "/verify-email/[token]"
      | "/admin/users/[id]"
    >
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
    }
  | {
      pathname: "/invite/[token]";
      params: {token: string};
    }
  | {
      pathname: "/admin/users";
      query?: {q?: string; status?: string; access?: string; page?: string};
    }
  | {
      pathname: "/admin/users/[id]";
      params: {id: string};
    }
  | {
      pathname: "/reset-password/[token]";
      params: {token: string};
    }
  | {
      pathname: "/verify-email/[token]";
      params: {token: string};
    };


export const catalogueCalendarHref = {
  pathname: "/courses",
  query: {view: "calendar"},
} as const satisfies PathnameHref;

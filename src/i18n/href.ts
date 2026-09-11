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
      | "/admin/rooms/[id]"
      | "/admin/bookings/[id]"
      | "/admin/requests/[id]"
      | "/rooms/bookings/[id]"
      | "/rooms/bookings/[id]/change"
      | "/rooms/bookings/[id]/cancel"
      | "/rooms/requests/[id]"
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
      pathname: "/admin/rooms/[id]";
      params: {id: string};
    }
  | {
      pathname: "/rooms";
      query?: {view?: string; date?: string; room?: string};
    }
  | {
      pathname: "/rooms/book";
      query?: {room?: string; date?: string; start?: string; end?: string};
    }
  | {
      pathname: "/admin/bookings";
      query?: {q?: string; status?: string; page?: string};
    }
  | {
      pathname: "/admin/bookings/new";
      query?: {user?: string; room?: string; date?: string; start?: string; end?: string};
    }
  | {
      pathname: "/admin/bookings/[id]";
      params: {id: string};
      query?: {
        action?: string;
        created?: string;
        moved?: string;
        cancelled?: string;
        waived?: string;
      };
    }
  | {
      pathname: "/rooms/bookings";
      query?: {reserved?: string; cancelled?: string};
    }
  | {
      pathname: "/rooms/bookings/[id]";
      params: {id: string};
      query?: {moved?: string; replaced?: string};
    }
  | {
      pathname: "/rooms/bookings/[id]/change";
      params: {id: string};
      query?: {room?: string; date?: string; start?: string; end?: string};
    }
  | {
      pathname: "/rooms/bookings/[id]/cancel";
      params: {id: string};
    }
  | {
      pathname: "/rooms/requests";
      query?: {submitted?: string; withdrawn?: string};
    }
  | {
      pathname: "/rooms/requests/new";
      query?: {room?: string; date?: string; start?: string; end?: string};
    }
  | {
      pathname: "/rooms/requests/[id]";
      params: {id: string};
    }
  | {
      pathname: "/admin/requests";
      query?: {q?: string; status?: string; page?: string};
    }
  | {
      pathname: "/admin/requests/[id]";
      params: {id: string};
      query?: {resolved?: string; declined?: string};
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

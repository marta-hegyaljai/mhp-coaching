import type {PathnameHref} from "@/i18n/href";

export type SignedInHomePath = Extract<
  PathnameHref,
  "/courses" | "/admin/users" | "/rooms"
>;

export function signedInHomePath(user: {
  isAdmin: boolean;
  roomBookingEnabled?: boolean;
  canAccessRooms?: boolean;
}): SignedInHomePath {
  if (user.canAccessRooms || user.roomBookingEnabled) {
    return "/rooms";
  }
  if (user.isAdmin) {
    return "/admin/users";
  }
  return "/courses";
}

export function signedInHomeHref(
  user: {
    isAdmin: boolean;
    roomBookingEnabled?: boolean;
    canAccessRooms?: boolean;
  },
  options?: {verified?: boolean},
): PathnameHref {
  const pathname = signedInHomePath(user);
  if (!options?.verified) {
    return pathname;
  }

  if (pathname === "/courses") {
    return {pathname: "/courses", query: {verified: "1"}};
  }
  if (pathname === "/rooms") {
    return {pathname: "/rooms", query: {verified: "1"}};
  }
  return {pathname: "/admin/users", query: {verified: "1"}};
}

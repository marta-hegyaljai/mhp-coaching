import type {PathnameHref} from "@/i18n/href";

export function signedInHomePath(user: {
  isAdmin: boolean;
  roomBookingEnabled?: boolean;
  canAccessRooms?: boolean;
}): Extract<PathnameHref, "/account" | "/admin/users" | "/rooms"> {
  if (user.isAdmin) {
    return "/admin/users";
  }
  if (user.canAccessRooms || user.roomBookingEnabled) {
    return "/rooms";
  }
  return "/account";
}

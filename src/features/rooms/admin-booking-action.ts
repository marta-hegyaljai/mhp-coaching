import type {PathnameHref} from "@/i18n/href";

export const ADMIN_BOOKING_ACTIONS = ["move", "cancel", "waive"] as const;
export type AdminBookingAction = (typeof ADMIN_BOOKING_ACTIONS)[number];

/**
 * The admin detail screen shows one decision at a time. The chosen decision
 * lives in the URL so a confirmation step is linkable and has a real way back.
 */
export function parseAdminBookingAction(
  value: string | string[] | undefined,
): AdminBookingAction | null {
  const raw = Array.isArray(value) ? value[0] : value;

  return raw && (ADMIN_BOOKING_ACTIONS as readonly string[]).includes(raw)
    ? (raw as AdminBookingAction)
    : null;
}

export function adminBookingDetailHref(
  bookingId: string,
  action?: AdminBookingAction,
): PathnameHref {
  return {
    pathname: "/admin/bookings/[id]",
    params: {id: bookingId},
    ...(action ? {query: {action}} : {}),
  };
}

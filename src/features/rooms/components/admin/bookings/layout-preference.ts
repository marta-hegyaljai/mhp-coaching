export const ADMIN_BOOKINGS_LAYOUT_KEY = "mhp-admin-bookings-layout";

export type AdminBookingsLayout = "table" | "cards";

export function isAdminBookingsLayout(value: string | null): value is AdminBookingsLayout {
  return value === "table" || value === "cards";
}

export function readAdminBookingsLayout(): AdminBookingsLayout {
  try {
    const stored = localStorage.getItem(ADMIN_BOOKINGS_LAYOUT_KEY);
    return isAdminBookingsLayout(stored) ? stored : "table";
  } catch {
    return "table";
  }
}

export function writeAdminBookingsLayout(layout: AdminBookingsLayout): void {
  try {
    localStorage.setItem(ADMIN_BOOKINGS_LAYOUT_KEY, layout);
  } catch {
    // Storage may be blocked in private browsing; the current session still switches.
  }
}

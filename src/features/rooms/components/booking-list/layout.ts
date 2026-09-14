export const ADMIN_BOOKINGS_LAYOUT_KEY = "mhp-admin-bookings-layout";
export const OWN_BOOKINGS_LAYOUT_KEY = "mhp-own-bookings-layout";

export type BookingsLayout = "table" | "cards";

export function isBookingsLayout(value: string | null): value is BookingsLayout {
  return value === "table" || value === "cards";
}

export function readBookingsLayout(storageKey: string): BookingsLayout {
  try {
    const stored = localStorage.getItem(storageKey);
    return isBookingsLayout(stored) ? stored : "table";
  } catch {
    return "table";
  }
}

export function writeBookingsLayout(storageKey: string, layout: BookingsLayout): void {
  try {
    localStorage.setItem(storageKey, layout);
  } catch {
    // Storage may be blocked in private browsing; the current session still switches.
  }
}

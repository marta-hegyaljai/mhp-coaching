import {resolveCheckoutDefaults, type CheckoutDefaults} from "@/features/auth/contact";
import {getCurrentUser} from "@/features/auth/session";

import {datesWithSlots, loadCallAvailability, slotsForDate} from "./availability";

export type AdviceSlot = {time: string; label: string};

/** Everything both advice pages need to render the scheduler and the form. */
export type AdviceView = {
  selectedDate: string;
  availableDates: string[];
  slotsByDate: Record<string, AdviceSlot[]>;
  minDate: string;
  maxDate: string;
  defaults: CheckoutDefaults | undefined;
};

/**
 * Availability and contact prefill are identical whether or not a course is
 * involved, so both advice pages read them from here.
 */
export async function loadAdviceView(requestedDate?: string): Promise<AdviceView> {
  const signedInUser = await getCurrentUser();
  const defaults = await resolveCheckoutDefaults(signedInUser);
  const availability = await loadCallAvailability();
  const availableDates = datesWithSlots(
    availability.hours,
    availability.booked,
    availability.window,
  );

  return {
    selectedDate: resolveSelectedDate(requestedDate, availableDates, availability.window),
    availableDates,
    slotsByDate: Object.fromEntries(
      availableDates.map((date) => [
        date,
        slotsForDate(date, availability.hours, availability.booked, availability.window).map(
          (slot) => ({time: slot.time, label: slot.time}),
        ),
      ]),
    ),
    minDate: availability.window.minDate,
    maxDate: availability.window.maxDate,
    defaults,
  };
}

/**
 * Honour a shared or bookmarked date only while it is still inside the booking
 * window; otherwise open on the first day that has a free slot.
 */
function resolveSelectedDate(
  requestedDate: string | undefined,
  availableDates: string[],
  window: {minDate: string; maxDate: string},
): string {
  if (requestedDate && requestedDate >= window.minDate && requestedDate <= window.maxDate) {
    return requestedDate;
  }
  return availableDates[0] ?? window.minDate;
}

/* Booking constants.
 *
 * Slots are the same every day: no weekend closure, no per-date availability,
 * no round trip to ask. When real availability lands, this is the module that
 * grows a `getSlotsForDate(date)` and SlotPicker stops reading SLOT_TIMES
 * directly.
 */

/** Consultations are a fixed 60 minutes — there is no duration picker. */
export const DEFAULT_DURATION_MINS = 60;

/**
 * Bookable start times, 8am to 6pm inclusive, on the hour.
 *
 * Hourly rather than every half hour because a consultation runs for
 * DEFAULT_DURATION_MINS: at 30-minute spacing, 08:00 and 08:30 would be
 * offered as separate slots while describing the same hour of a tutor's time.
 * The last slot starts at 18:00 and therefore ends at 19:00.
 */
export const SLOT_TIMES: readonly string[] = Array.from(
  { length: 11 },
  (_, i) => `${String(8 + i).padStart(2, "0")}:00`,
);

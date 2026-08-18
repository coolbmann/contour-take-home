/* Dates are rendered in en-AU — this is a Melbourne-based tutoring service and
 * `toLocaleDateString()` without a locale would follow the server's, which
 * silently differs between local dev and deployment. */

const LOCALE = "en-AU";

function toDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "Thu 20 Aug" */
export function formatDateShort(iso: string): string {
  return toDate(iso).toLocaleDateString(LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** "Thursday 20 August 2026" */
export function formatDateLong(iso: string): string {
  return toDate(iso).toLocaleDateString(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "4:00 pm" */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d
    .toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" })
    .toLowerCase();
}

/** "Thu 20 Aug · 4:00 pm" */
export function formatWhen(iso: string, hhmm: string): string {
  return `${formatDateShort(iso)} · ${formatTime(hhmm)}`;
}

/* Bridging the picker, which speaks Date, and everything else here, which
 * speaks `YYYY-MM-DD`. Both go through local time on purpose: the calendar
 * shows the user's own days, and a UTC round trip moves a late-evening
 * booking onto the wrong one. */

/** Local `YYYY-MM-DD` for a Date. */
export function isoFromDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** A local midnight Date for a `YYYY-MM-DD` string. */
export function dateFromIso(iso: string): Date {
  return toDate(iso);
}

/* ---------------------------------------------------------------------------
 * Bridging `booking_date_time` (a single timestamptz) and the picker, which
 * works in a local date plus an `HH:mm` slot. Conversions go through the local
 * timezone deliberately: slots are wall-clock business hours, so 4pm must stay
 * 4pm for the person reading it.
 * ------------------------------------------------------------------------- */

/** Local `YYYY-MM-DD` for a stored booking. */
export function dateOf(bookingDateTime: string): string {
  const d = new Date(bookingDateTime);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Local `HH:mm` for a stored booking. */
export function timeOf(bookingDateTime: string): string {
  const d = new Date(bookingDateTime);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Combine a picked date + slot into the value the column stores. */
export function toBookingDateTime(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0).toISOString();
}

/** "Thu 20 Aug · 4:00 pm" straight from a stored booking. */
export function formatBooking(bookingDateTime: string): string {
  return formatWhen(dateOf(bookingDateTime), timeOf(bookingDateTime));
}

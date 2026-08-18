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

/** "Today" / "Tomorrow" / "Thu 20 Aug" */
export function formatRelativeDay(iso: string, today: string, tomorrow: string): string {
  if (iso === today) return "Today";
  if (iso === tomorrow) return "Tomorrow";
  return formatDateShort(iso);
}

/** "20" — day of month, for the date strip. */
export function isoDayNum(iso: string): string {
  return String(toDate(iso).getDate());
}

/** "Aug" — short month, for the date strip. */
export function isoMonthShort(iso: string): string {
  return toDate(iso).toLocaleDateString(LOCALE, { month: "short" });
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

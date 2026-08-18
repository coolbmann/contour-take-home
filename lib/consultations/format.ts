const LOCALE = "en-AU";

function toDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateShort(iso: string): string {
  return toDate(iso).toLocaleDateString(LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatDateLong(iso: string): string {
  return toDate(iso).toLocaleDateString(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d
    .toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" })
    .toLowerCase();
}

export function formatWhen(iso: string, hhmm: string): string {
  return `${formatDateShort(iso)} · ${formatTime(hhmm)}`;
}

export function isoFromDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function dateFromIso(iso: string): Date {
  return toDate(iso);
}

export function dateOf(bookingDateTime: string): string {
  const d = new Date(bookingDateTime);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export function timeOf(bookingDateTime: string): string {
  const d = new Date(bookingDateTime);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function toBookingDateTime(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0).toISOString();
}

export function formatBooking(bookingDateTime: string): string {
  return formatWhen(dateOf(bookingDateTime), timeOf(bookingDateTime));
}

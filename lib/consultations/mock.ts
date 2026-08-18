import { toBookingDateTime } from "@/lib/consultations/format";
import type { Consultation, Slot } from "@/lib/consultations/types";

/* Mock data stands in for the API. Dates are generated relative to today so the
 * list never goes stale, and everything derived from them is deterministic —
 * the same date always yields the same slots, so re-renders don't reshuffle. */

/** `YYYY-MM-DD` for today + `offsetDays`, in local time (not UTC). */
export function isoDate(offsetDays = 0, from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offsetDays);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * The nth business day from `from` (n=1 → next weekday). Consultations are only
 * bookable Mon–Fri, so seeding the mock with raw day offsets would place
 * bookings on days `getSlotsForDate` reports as closed.
 */
export function businessDate(n: number, from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let moved = 0;
  while (moved < n) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) moved++;
  }
  return isoDate(0, d);
}

/** Consultations are a fixed 60 minutes — there is no duration picker. */
export const DEFAULT_DURATION_MINS = 60;

/* Shaped like rows of public.consultations: integer id, uuid user_id, and a
 * single `booking_date_time`. `student_name` stands in for the join against
 * public.user_profiles. */
export const MOCK_CONSULTATIONS: Consultation[] = [
  {
    id: 1,
    user_id: "3f1c1d0a-8f4b-4a2e-9c31-1a0b7d5e6f01",
    user_profiles: { first_name: "Ada", last_name: "Nguyen" },
    booking_date_time: toBookingDateTime(businessDate(1), "16:00"),
    duration_mins: DEFAULT_DURATION_MINS,
    reason:
      "Stuck on integration by substitution — want to work through the SAC revision set before the practice exam.",
  },
  {
    id: 2,
    user_id: "6b2e4c77-2d19-4c8f-90a5-2c4e8f7a1b02",
    user_profiles: { first_name: "Marcus", last_name: "Okonkwo" },
    booking_date_time: toBookingDateTime(businessDate(2), "09:30"),
    duration_mins: DEFAULT_DURATION_MINS,
    reason:
      "Go over redox half-equations and titration calculations from last week's prac.",
  },
  {
    id: 3,
    user_id: "9d5a0e13-7c62-4f18-83b7-5e9d2a6c3b03",
    user_profiles: { first_name: "Priya", last_name: "Raman" },
    booking_date_time: toBookingDateTime(businessDate(2), "17:30"),
    duration_mins: DEFAULT_DURATION_MINS,
    reason: "Essay structure feedback on the analytical commentary draft.",
  },
  {
    id: 4,
    user_id: "c4718b2f-5a30-4d96-a1c8-7f3b9e5d2c04",
    user_profiles: { first_name: "Tom", last_name: "Whelan" },
    booking_date_time: toBookingDateTime(businessDate(4), "11:00"),
    duration_mins: DEFAULT_DURATION_MINS,
    reason: "Complex numbers — de Moivre's theorem and locus problems.",
  },
  {
    id: 5,
    user_id: "e0936a48-1b57-4e2d-8f04-9a6c1d7b4e05",
    user_profiles: { first_name: "Sofia", last_name: "Marchetti" },
    booking_date_time: toBookingDateTime(businessDate(5), "14:15"),
    duration_mins: DEFAULT_DURATION_MINS,
    reason:
      "Clarify the difference between the humoral and cell-mediated immune responses.",
  },
  {
    id: 6,
    user_id: "a7c52f91-4e08-4b3a-95d6-3b8f0c2a9d06",
    user_profiles: { first_name: "Daniel", last_name: "Chau" },
    booking_date_time: toBookingDateTime(businessDate(7), "18:00"),
    duration_mins: DEFAULT_DURATION_MINS,
    reason:
      "Projectile motion questions and exam technique for the multiple-choice section.",
  },
];

const ALL_TIMES = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
];

/** Small deterministic hash so a given date always produces the same slots. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Stand-in for `GET /api/consultations/slots?date=…`. Weekends return nothing,
 * which is what makes the empty state worth having.
 */
export function getSlotsForDate(date: string): Slot[] {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = new Date(y, m - 1, d).getDay();
  if (weekday === 0 || weekday === 6) return [];

  // Hash per (date, time) rather than shifting one seed: a signed `>>` turns
  // hashes above 2^31 negative, and shifted bits of one seed are correlated.
  return ALL_TIMES.map((time) => ({
    time,
    // ~30% taken, stable for a given (date, time).
    available: hash(`${date}#${time}`) % 10 > 2,
  }));
}

/** The next `count` days, for the date strip. */
export function upcomingDates(count: number, from = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => isoDate(i, from));
}

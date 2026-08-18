import { z } from "zod";

import { DEFAULT_DURATION_MINS } from "@/lib/consultations/slots";

/* Request validation for /api/consultation.
 *
 * The live `consultations` table carries no CHECK constraints, so these
 * schemas are the only thing standing between the request body and the row —
 * they are a guard, not a convenience. */

/** Accepts both `...Z` and `...+10:00`; the client sends the former. */
const bookingDateTime = z.iso.datetime({ offset: true });

/** Trimmed, so " " is rejected rather than stored as a blank reason. */
const reason = z
  .string()
  .trim()
  .min(1, "Add a reason so the tutor knows what to prepare.")
  .max(1000, "Keep the reason under 1000 characters.");

const durationMins = z
  .number()
  .int()
  .min(15, "Consultations are at least 15 minutes.")
  .max(480, "Consultations cannot run longer than 8 hours.");

/**
 * POST body.
 *
 * Note the absence of `user_id`. The booking form's ConsultationDraft carries
 * one and Zod strips unknown keys, so a caller can send whatever owner they
 * like and it will be discarded — the route writes `access.userId`.
 */
export const createConsultationSchema = z.object({
  booking_date_time: bookingDateTime,
  duration_mins: durationMins.default(DEFAULT_DURATION_MINS),
  reason,
});

/**
 * PATCH body — every field optional, but not all of them at once. An empty
 * patch is a client bug, and answering 200 to it hides that.
 */
export const updateConsultationSchema = z
  .object({
    booking_date_time: bookingDateTime.optional(),
    reason: reason.optional(),
  })
  .refine((changes) => Object.keys(changes).length > 0, {
    message: "Provide booking_date_time and/or reason.",
  });

/** `:id` off the URL — a path segment is always a string. */
export const consultationIdSchema = z.coerce
  .number()
  .int()
  .positive("Consultation ids are positive integers.");

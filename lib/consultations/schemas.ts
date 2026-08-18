import { z } from "zod";

import { DEFAULT_DURATION_MINS } from "@/lib/consultations/slots";

const bookingDateTime = z.iso.datetime({ offset: true });

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

export const createConsultationSchema = z.object({
  booking_date_time: bookingDateTime,
  duration_mins: durationMins.default(DEFAULT_DURATION_MINS),
  reason,
});

export const updateConsultationSchema = z
  .object({
    booking_date_time: bookingDateTime.optional(),
    reason: reason.optional(),
  })
  .refine((changes) => Object.keys(changes).length > 0, {
    message: "Provide booking_date_time and/or reason.",
  });

export const consultationIdSchema = z.coerce
  .number()
  .int()
  .positive("Consultation ids are positive integers.");

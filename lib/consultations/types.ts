/** Mirrors a row of public.consultations. */
export type Consultation = {
  /** `integer generated always as identity`. */
  id: number;
  /** uuid — the booking's owner. */
  user_id: string;
  /** `timestamptz`, ISO 8601. The UI splits this into a date and a slot. */
  booking_date_time: string;
  duration_mins: number;
  /** Nullable in the database, though the form requires one. */
  reason: string | null;
  /** Set when the booking is cancelled. Live rows are `null`. */
  deleted_at: string | null;
  /** Set when the consultation is marked done. `null` reads as "Incomplete". */
  completed_at: string | null;

  /** Joined from public.user_profiles — not a column on consultations. */
  user_profiles: { first_name: string; last_name: string };
};

/**
 * Insert payload for public.consultations (id/created_at/updated_at/deleted_at
 * are DB-side).
 *
 * `user_id` is here because the booking form knows who it is booking for, but
 * the API does not trust it — POST /api/consultation takes the owner from the
 * session. See createConsultation() in services/consultation-service.ts.
 */
export type ConsultationDraft = {
  user_id: string;
  booking_date_time: string;
  duration_mins: number;
  reason: string | null;
};

/** Update payload — only the fields this UI can change. */
export type ConsultationChanges = {
  booking_date_time: string;
  reason: string | null;
};

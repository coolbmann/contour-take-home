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

  /** Joined from public.user_profiles — not a column on consultations. */
  user_profiles: { first_name: string; last_name: string };
};

/** Insert payload for public.consultations (id/created_at/updated_at are DB-side). */
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

export type Slot = {
  /** `HH:mm`, 24h. */
  time: string;
  available: boolean;
};

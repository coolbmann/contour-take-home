export type Consultation = {
  id: number;

  user_id: string;

  booking_date_time: string;
  duration_mins: number;

  reason: string | null;

  deleted_at: string | null;

  completed_at: string | null;

  user_profiles: { first_name: string; last_name: string };
};

export type ConsultationDraft = {
  user_id: string;
  booking_date_time: string;
  duration_mins: number;
  reason: string | null;
};

export type ConsultationChanges = {
  booking_date_time: string;
  reason: string | null;
};

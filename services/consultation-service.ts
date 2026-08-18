import { SupabaseClient } from "@supabase/supabase-js";

import { requireAccess } from "@/lib/auth";
import type {
  Consultation,
  ConsultationChanges,
  ConsultationDraft,
} from "@/lib/consultations/types";

const WITH_STUDENT = `
  *,
  user_profiles(first_name, last_name)
`;

type ConsultationRow = Omit<Consultation, "user_profiles"> & {
  user_profiles: { first_name: string; last_name: string } | null;
};

const NO_NAME = { first_name: "", last_name: "" };

const normalise = (row: ConsultationRow): Consultation => ({
  ...row,
  user_profiles: row.user_profiles ?? NO_NAME,
});

export class ConsultationNotFoundError extends Error {
  readonly status = 404 as const;

  constructor(id: number) {
    super(`No consultation ${id}.`);
    this.name = "ConsultationNotFoundError";
  }
}

export const getConsultations = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<Consultation[]> => {
  await requireAccess({ permissions: ["consultation.read"] });

  const { data, error } = await supabase
    .from("consultations")
    .select(WITH_STUDENT)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("booking_date_time", { ascending: true });

  if (error) {
    throw error;
  }
  return ((data ?? []) as unknown as ConsultationRow[]).map(normalise);
};

export const getAllConsultations = async (
  supabase: SupabaseClient,
): Promise<Consultation[]> => {
  await requireAccess({ permissions: ["consultation.readAll"] });

  const { data, error } = await supabase
    .from("consultations")
    .select(WITH_STUDENT)
    .is("deleted_at", null)
    .order("booking_date_time", { ascending: true });

  if (error) {
    throw error;
  }
  return ((data ?? []) as unknown as ConsultationRow[]).map(normalise);
};

type OwnedConsultation = {
  id: number;
  user_id: string;
  deleted_at: string | null;
  completed_at: string | null;
};

const requireOwned = async (
  supabase: SupabaseClient,
  userId: string,
  id: number,
): Promise<OwnedConsultation> => {
  const { data, error } = await supabase
    .from("consultations")
    .select("id, user_id, deleted_at, completed_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.user_id !== userId || data.deleted_at !== null) {
    throw new ConsultationNotFoundError(id);
  }
  return data as OwnedConsultation;
};

export const createConsultation = async (
  supabase: SupabaseClient,
  userId: string,
  draft: Omit<ConsultationDraft, "user_id">,
): Promise<Consultation> => {
  await requireAccess({ permissions: ["consultation.create"] });

  const { data, error } = await supabase
    .from("consultations")
    .insert({ ...draft, user_id: userId })
    .select(WITH_STUDENT)
    .single();

  if (error) throw error;
  return normalise(data as unknown as ConsultationRow);
};

export const updateConsultation = async (
  supabase: SupabaseClient,
  userId: string,
  id: number,
  changes: Partial<ConsultationChanges>,
): Promise<Consultation> => {
  await requireAccess({ permissions: ["consultation.update"] });
  await requireOwned(supabase, userId, id);

  const { data, error } = await supabase
    .from("consultations")
    .update(changes)

    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select(WITH_STUDENT)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new ConsultationNotFoundError(id);
  return normalise(data as unknown as ConsultationRow);
};

export const softDeleteConsultation = async (
  supabase: SupabaseClient,
  userId: string,
  id: number,
): Promise<void> => {
  await requireAccess({ permissions: ["consultation.delete"] });
  await requireOwned(supabase, userId, id);

  const { data, error } = await supabase
    .from("consultations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)

    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new ConsultationNotFoundError(id);
};

export const completeConsultation = async (
  supabase: SupabaseClient,
  userId: string,
  id: number,
): Promise<Consultation> => {
  await requireAccess({ permissions: ["consultation.update"] });
  const existing = await requireOwned(supabase, userId, id);

  const { data, error } = await supabase
    .from("consultations")
    .update({ completed_at: existing.completed_at ?? new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select(WITH_STUDENT)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new ConsultationNotFoundError(id);
  return normalise(data as unknown as ConsultationRow);
};

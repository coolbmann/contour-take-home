import { SupabaseClient } from "@supabase/supabase-js";

import { requireAccess } from "@/lib/auth";
import type {
  Consultation,
  ConsultationChanges,
  ConsultationDraft,
} from "@/lib/consultations/types";

/* Every function here is guarded with requireAccess(), as well as at the route.
 * A service that trusts its callers is one forgotten wrapper away from being an
 * open endpoint, and getAccessContext() is request-cached so the second check
 * costs nothing.
 *
 * The owner is always a parameter taken from the session — never a field read
 * off the request body. */

/* A left join, not `user_profiles!inner`: a booking whose owner has no
 * public.user_profiles row still exists, and an inner join would make it vanish
 * from the list — or, worse, make the insert below succeed and then fail to
 * return the row it just wrote. The name is missing, not the booking. */
const WITH_STUDENT = `
  *,
  user_profiles(first_name, last_name)
`;

/** Shape PostgREST returns for the select above, before normalising. */
type ConsultationRow = Omit<Consultation, "user_profiles"> & {
  user_profiles: { first_name: string; last_name: string } | null;
};

const NO_NAME = { first_name: "", last_name: "" };

const normalise = (row: ConsultationRow): Consultation => ({
  ...row,
  user_profiles: row.user_profiles ?? NO_NAME,
});

/**
 * Raised when the id does not exist, is already cancelled, or belongs to
 * someone else.
 *
 * All three are deliberately one error. consultations.id is a sequential
 * integer, so answering 403 for "exists but not yours" would let anyone holding
 * an account count and probe every booking in the system. The caller cannot
 * tell "no such booking" from "not your booking", which is the point.
 */
export class ConsultationNotFoundError extends Error {
  readonly status = 404 as const;

  constructor(id: number) {
    super(`No consultation ${id}.`);
    this.name = "ConsultationNotFoundError";
  }
}

/** Live consultations owned by `userId`, soonest first. */
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

/** What requireOwned() hands back — enough to decide, not the whole row. */
type OwnedConsultation = {
  id: number;
  user_id: string;
  deleted_at: string | null;
  completed_at: string | null;
};

/**
 * The ownership check every mutation runs before writing.
 *
 * This is only half the enforcement. It exists to turn "not yours" into a clean
 * 404 instead of a silent no-op — the write itself repeats `.eq("user_id")`, so
 * a row that changed hands between this read and that write still cannot be
 * touched. Never rely on this check alone.
 *
 * Returns the row it read, so a caller that needs the current state does not
 * pay for a second round trip to get it.
 */
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

/**
 * Book a consultation for `userId`.
 *
 * The owner is the signed-in user, full stop — the draft carries no `user_id`,
 * so there is no field for a caller to forge.
 */
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

/** Change the time and/or reason of a live consultation owned by `userId`. */
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
    // Ownership and liveness are re-asserted as filters, so the statement
    // itself is safe even if the check above raced a concurrent cancellation.
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select(WITH_STUDENT)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new ConsultationNotFoundError(id);
  return normalise(data as unknown as ConsultationRow);
};

/**
 * Cancel a consultation by stamping `deleted_at`.
 *
 * The row stays. A cancellation is a thing that happened, and the slot history
 * is what a support conversation about a disputed booking runs on.
 */
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
    // Also makes the operation idempotent-safe: a second cancel matches no row
    // rather than overwriting the original cancellation time.
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new ConsultationNotFoundError(id);
};

/**
 * Mark a consultation done.
 *
 * Idempotent by construction: the write carries the existing timestamp forward
 * when there is one, so calling this twice succeeds and the original completion
 * time survives. A second call is a double-click, not an error worth showing
 * someone.
 *
 * Completion is one-way — there is no argument to clear the column, so this
 * function cannot un-complete a booking however it is called.
 */
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

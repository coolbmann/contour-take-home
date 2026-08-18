import { SupabaseClient } from "@supabase/supabase-js";

import { requireAccess } from "@/lib/auth";
import type { Consultation } from "@/lib/consultations/types";

/* Guarded here as well as at the route. A service that trusts its callers is
 * one forgotten wrapper away from being an open endpoint, and getAccessContext()
 * is request-cached so the second check costs nothing. */
export const getConsultations = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<Consultation[]> => {
  await requireAccess({ permissions: ["consultation.read"] });

  const { data, error } = await supabase
    .from("consultations")
    .select(
      `
    *,
    user_profiles!inner(first_name, last_name)
  `,
    )
    .eq("user_id", userId)
    .order("booking_date_time", { ascending: true });

  if (error) {
    throw error;
  }
  return (data ?? []) as Consultation[];
};

import { NextResponse } from "next/server";

import { withAuthorization } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getConsultations } from "@/services/consultation-service";

/* The guard sits on the handler, so the rule is visible at the route it
 * protects. `access` is handed to the handler already resolved — no second
 * lookup for the user id. */

export const GET = withAuthorization(
  { permissions: ["consultation.read"] },
  async (_request, { access }) => {
    const supabase = await createClient();
    const consultations = await getConsultations(supabase, access.userId);
    return NextResponse.json(consultations);
  },
);

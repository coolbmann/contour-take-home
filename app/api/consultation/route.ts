import { NextResponse } from "next/server";

import { withAuthorization } from "@/lib/auth";
import { createConsultationSchema } from "@/lib/consultations/schemas";
import { createClient } from "@/lib/supabase/server";
import {
  createConsultation,
  getConsultations,
} from "@/services/consultation-service";

/* The guard sits on the handler, so the rule is visible at the route it
 * protects. `access` is handed to the handler already resolved — no second
 * lookup for the user id.
 *
 * Read and create are separate grants: a role can be allowed to see its
 * bookings without being allowed to make more. */

export const GET = withAuthorization(
  { permissions: ["consultation.read"] },
  async (_request, { access }) => {
    const supabase = await createClient();
    const consultations = await getConsultations(supabase, access.userId);
    return NextResponse.json(consultations);
  },
);

export const POST = withAuthorization(
  { permissions: ["consultation.create"] },
  async (request, { access }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      // A malformed body is the caller's mistake, not a server fault.
      return NextResponse.json(
        { error: "Expected a JSON body." },
        { status: 400 },
      );
    }

    const parsed = createConsultationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid consultation.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    // access.userId, not anything off the body — see the schema's note.
    const consultation = await createConsultation(
      supabase,
      access.userId,
      parsed.data,
    );

    return NextResponse.json(consultation, { status: 201 });
  },
);

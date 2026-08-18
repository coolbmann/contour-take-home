import { NextResponse } from "next/server";

import { withAuthorization } from "@/lib/auth";
import { consultationIdSchema } from "@/lib/consultations/schemas";
import { createClient } from "@/lib/supabase/server";
import {
  ConsultationNotFoundError,
  completeConsultation,
} from "@/services/consultation-service";

/* Completion is its own route rather than a field on PATCH.
 *
 * PATCH edits a booking — its time, its reason. This closes one out, which is a
 * state transition, not an edit: it takes no body, it is idempotent, and it
 * only ever moves in one direction. Folding it into PATCH would mean a body
 * where `reason` and `completed` mean quite different kinds of thing.
 *
 * POST rather than PUT because there is nothing to put. Guarded by
 * consultation.update: closing out a booking is a change to a booking you can
 * already change. */

type Context = { params: Promise<{ id: string }> };

export const POST = withAuthorization<Context>(
  { permissions: ["consultation.update"] },
  async (_request, { params, access }) => {
    const { id } = await params;

    const parsed = consultationIdSchema.safeParse(id);
    if (!parsed.success) {
      return NextResponse.json(
        { error: `"${id}" is not a consultation id.` },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    try {
      // 200 with the row, not 204: the caller needs the new state to repaint
      // the tag, and making it refetch to learn the outcome of its own write
      // is a round trip for nothing.
      const consultation = await completeConsultation(
        supabase,
        access.userId,
        parsed.data,
      );
      return NextResponse.json(consultation);
    } catch (error) {
      if (error instanceof ConsultationNotFoundError) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      throw error;
    }
  },
);

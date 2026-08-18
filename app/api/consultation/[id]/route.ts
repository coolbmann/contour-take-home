import { NextResponse } from "next/server";

import { withAuthorization } from "@/lib/auth";
import {
  consultationIdSchema,
  updateConsultationSchema,
} from "@/lib/consultations/schemas";
import { createClient } from "@/lib/supabase/server";
import {
  ConsultationNotFoundError,
  softDeleteConsultation,
  updateConsultation,
} from "@/services/consultation-service";

/* Both handlers here mutate someone's booking, so both run the ownership check
 * in the service before writing — and the write itself re-filters on the owner,
 * so the check cannot be raced. See requireOwned() in the service. */

type Context = { params: Promise<{ id: string }> };

/** Shared by PATCH and DELETE: the `:id` segment, or a 400 to return. */
function readId(id: string):
  | { ok: true; id: number }
  | { ok: false; response: NextResponse } {
  const parsed = consultationIdSchema.safeParse(id);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `"${id}" is not a consultation id.` },
        { status: 400 },
      ),
    };
  }
  return { ok: true, id: parsed.data };
}

/**
 * withAuthorization maps AuthorizationError for us; this covers the other
 * error a mutation route is expected to produce. Anything else is a genuine
 * fault and is left to become a 500.
 */
function toResponse(error: unknown): NextResponse {
  if (error instanceof ConsultationNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  throw error;
}

export const PATCH = withAuthorization<Context>(
  { permissions: ["consultation.update"] },
  async (request, { params, access }) => {
    const id = readId((await params).id);
    if (!id.ok) return id.response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Expected a JSON body." },
        { status: 400 },
      );
    }

    const parsed = updateConsultationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid changes.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    try {
      const consultation = await updateConsultation(
        supabase,
        access.userId,
        id.id,
        parsed.data,
      );
      return NextResponse.json(consultation);
    } catch (error) {
      return toResponse(error);
    }
  },
);

/**
 * Soft delete: stamps `deleted_at` rather than removing the row, so the
 * cancellation stays on the record. 204, because there is nothing left to
 * describe.
 */
export const DELETE = withAuthorization<Context>(
  { permissions: ["consultation.delete"] },
  async (_request, { params, access }) => {
    const id = readId((await params).id);
    if (!id.ok) return id.response;

    const supabase = await createClient();
    try {
      await softDeleteConsultation(supabase, access.userId, id.id);
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return toResponse(error);
    }
  },
);

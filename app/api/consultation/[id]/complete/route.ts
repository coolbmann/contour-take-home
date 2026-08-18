import { NextResponse } from "next/server";

import { withAuthorization } from "@/lib/auth";
import { consultationIdSchema } from "@/lib/consultations/schemas";
import { createClient } from "@/lib/supabase/server";
import {
  ConsultationNotFoundError,
  completeConsultation,
} from "@/services/consultation-service";

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

import { NextResponse } from "next/server";

import { withAuthorization } from "@/lib/auth";
import { createConsultationSchema } from "@/lib/consultations/schemas";
import { createClient } from "@/lib/supabase/server";
import {
  createConsultation,
  getConsultations,
} from "@/services/consultation-service";

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

    const consultation = await createConsultation(
      supabase,
      access.userId,
      parsed.data,
    );

    return NextResponse.json(consultation, { status: 201 });
  },
);
